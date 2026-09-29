package com.codemates.auth.service;

import com.codemates.auth.dto.*;
import com.codemates.auth.event.UserRegisteredEvent;
import com.codemates.auth.exception.InvalidTokenException;
import com.codemates.auth.exception.UserAlreadyExistsException;
import com.codemates.auth.model.User;
import com.codemates.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final long RESET_CODE_TTL_MINUTES = 15;

    // an 8-digit code has only 10^8 possibilities, so wrong guesses are capped per code
    private static final int MAX_RESET_CODE_ATTEMPTS = 5;

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final KafkaTemplate<String, byte[]> kafkaTemplate;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;
    private final EmailService emailService;

    // max forgot-password requests per email per hour (raise this while testing)
    @Value("${app.password-reset.max-requests-per-hour:3}")
    private int maxResetRequestsPerHour;

    // REGISTER
    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {

        // check email
        if (userRepository.existsByEmailAndIsDeletedFalse(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered: " + request.getEmail());
        }

        // check username
        if (userRepository.existsByUsernameAndIsDeletedFalse(request.getUsername())) {
            throw new UserAlreadyExistsException("Username already taken: " + request.getUsername());
        }

        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .username(request.getUsername())
                .authProvider("LOCAL")
                .isActive(true)
                .isDeleted(false)
                .build();

        User savedUser = userRepository.save(user);
        log.info("New user registered: {}", savedUser.getEmail());

        publishUserRegisteredEvent(savedUser, request.getUsername(), request.getFullName());

        String accessToken = jwtService.generateAccessToken(savedUser.getId(), savedUser.getEmail());
        String refreshToken = refreshTokenService.createRefreshToken(
                savedUser.getId(), "Registration", ipAddress);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(savedUser.getId())
                .email(savedUser.getEmail())
                .authProvider(savedUser.getAuthProvider())
                .build();
    }

    // LOGIN
    @Transactional
    public AuthResponse login(LoginRequest request, String ipAddress, String deviceInfo) {

        // 1. find user by email
        User user = userRepository.findByEmailAndIsDeletedFalse(request.getEmail())
                .orElseThrow(() -> new InvalidTokenException("Invalid email or password"));

        // 2. check account is active
        if (!user.getIsActive()) {
            throw new InvalidTokenException("Account is deactivated");
        }

        // 3. verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidTokenException("Invalid email or password");
        }

        // 4. update last login
        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        // 5. generate tokens
        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = refreshTokenService.createRefreshToken(
                user.getId(),
                deviceInfo,
                ipAddress
        );

        log.info("User logged in: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .authProvider(user.getAuthProvider())
                .build();
    }

    // REFRESH TOKEN
    @Transactional
    public AuthResponse refresh(RefreshTokenRequest request, String ipAddress) {

        // 1. validate the incoming refresh token
        var existingToken = refreshTokenService.validateRefreshToken(request.getRefreshToken());

        // 2. load the user
        User user = userRepository.findById(existingToken.getUserId())
                .orElseThrow(() -> new InvalidTokenException("User not found"));

        // 3. revoke old refresh token
        refreshTokenService.revokeRefreshToken(request.getRefreshToken());

        // 4. issue new tokens (token rotation)
        String newAccessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String newRefreshToken = refreshTokenService.createRefreshToken(
                user.getId(),
                existingToken.getDeviceInfo(),
                ipAddress
        );

        log.info("Token refreshed for user: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .authProvider(user.getAuthProvider())
                .build();
    }

    // LOGOUT
    @Transactional
    public void logout(RefreshTokenRequest request) {
        refreshTokenService.revokeRefreshToken(request.getRefreshToken());
        log.info("User logged out successfully");
    }

    // LOGOUT FROM ALL DEVICES
    @Transactional
    public void logoutAllDevices(UUID userId) {
        refreshTokenService.revokeAllTokensForUser(userId);
        log.info("All devices logged out for userId: {}", userId);
    }

    // FORGOT PASSWORD
    // Always returns normally (the controller sends the same generic 200 either way),
    // so callers can never tell whether an email is registered.
    public void forgotPassword(ForgotPasswordRequest request) {

        String email = request.getEmail().trim();
        String normalizedEmail = email.toLowerCase();

        // 1. rate limit per email: stops someone spamming a victim's inbox
        String limitKey = "password_reset_limit:" + normalizedEmail;
        Long attempts = redisTemplate.opsForValue().increment(limitKey);
        if (attempts != null && attempts == 1L) {
            redisTemplate.expire(limitKey, Duration.ofHours(1));
        }
        if (attempts != null && attempts > maxResetRequestsPerHour) {
            log.warn("Password reset rate limit reached for {}", email);
            return;
        }

        // 2. only registered emails get a code + email; unknown emails silently do nothing
        userRepository.findByEmailAndIsDeletedFalse(email)
                .ifPresent(user -> {
                    // 3. generate 8-digit code
                    String code = generateResetCode();

                    // 4. store "userId:code" in Redis keyed by EMAIL (15 min TTL).
                    //    A new request overwrites the previous code and resets the wrong-attempt counter.
                    redisTemplate.opsForValue().set(
                            resetCodeKey(normalizedEmail),
                            user.getId() + ":" + code,
                            Duration.ofMinutes(RESET_CODE_TTL_MINUTES)
                    );
                    redisTemplate.delete(resetAttemptsKey(normalizedEmail));

                    // 5. email the code + link (async). The code is NOT logged.
                    emailService.sendPasswordResetEmail(
                            user.getEmail(), code, RESET_CODE_TTL_MINUTES);

                    log.info("Password reset requested for userId: {}", user.getId());
                });
    }

    // GITHUB OAUTH LOGIN / REGISTER
    @Transactional
    public AuthResponse loginOrRegisterWithGithub(String email, String githubUsername, String fullName, String githubUserId, String ipAddress) {

        User user = userRepository.findByEmailAndIsDeletedFalse(email)
                .orElseGet(() -> registerGithubUser(email, githubUsername, fullName, githubUserId));

        if (!user.getIsActive()) {
            throw new InvalidTokenException("Account is deactivated");
        }

        user.setLastLoginAt(java.time.LocalDateTime.now());
        userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user.getId(), user.getEmail());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId(), "GitHub OAuth", ipAddress);

        log.info("User logged in via GitHub: {}", user.getEmail());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .email(user.getEmail())
                .authProvider(user.getAuthProvider())
                .build();
    }

    private User registerGithubUser(String email, String githubUsername, String fullName, String githubUserId) {
        String username = githubUsername;
        int suffix = 0;
        while (userRepository.existsByUsernameAndIsDeletedFalse(username)) {
            suffix++;
            username = githubUsername + suffix;
        }

        User user = User.builder()
                .email(email)
                .username(username)
                .authProvider("GITHUB")
                .githubId(githubUserId)
                .isActive(true)
                .isDeleted(false)
                .build();
        // passwordHash intentionally left null (nullable in User.java)

        User saved = userRepository.save(user);
        log.info("New user registered via GitHub: {}", saved.getEmail());
        publishUserRegisteredEvent(saved, username, fullName);
        return saved;
    }

    // RESET PASSWORD (email + 8-digit code + new password)
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        String codeKey = resetCodeKey(normalizedEmail);
        String attemptsKey = resetAttemptsKey(normalizedEmail);

        // 1. look up the stored "userId:code" for this email
        String stored = redisTemplate.opsForValue().get(codeKey);
        if (stored == null) {
            throw new InvalidTokenException("Reset code is invalid or expired");
        }

        // 2. count this attempt; too many wrong guesses burns the code
        Long attempts = redisTemplate.opsForValue().increment(attemptsKey);
        if (attempts != null && attempts == 1L) {
            redisTemplate.expire(attemptsKey, Duration.ofMinutes(RESET_CODE_TTL_MINUTES));
        }
        if (attempts != null && attempts > MAX_RESET_CODE_ATTEMPTS) {
            redisTemplate.delete(codeKey);
            redisTemplate.delete(attemptsKey);
            log.warn("Password reset code burned after too many attempts for {}", normalizedEmail);
            throw new InvalidTokenException("Too many incorrect attempts. Please request a new code.");
        }

        // 3. split stored value and compare the code in constant time
        int sep = stored.indexOf(':');
        if (sep < 0) {
            redisTemplate.delete(codeKey);
            throw new InvalidTokenException("Reset code is invalid or expired");
        }
        String userIdStr = stored.substring(0, sep);
        String storedCode = stored.substring(sep + 1);

        boolean matches = MessageDigest.isEqual(
                storedCode.getBytes(StandardCharsets.UTF_8),
                request.getCode().getBytes(StandardCharsets.UTF_8));
        if (!matches) {
            throw new InvalidTokenException("Reset code is invalid or expired");
        }

        // 4. load user
        UUID userId = UUID.fromString(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidTokenException("User not found"));

        // 5. update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 6. delete code + attempts so it can't be reused
        redisTemplate.delete(codeKey);
        redisTemplate.delete(attemptsKey);

        // 7. revoke all refresh tokens — force re-login everywhere
        refreshTokenService.revokeAllTokensForUser(userId);

        log.info("Password reset successful for userId: {}", userId);
    }

    // ─── helpers ───────────────────────────────────────────────

    /** Cryptographically secure 8-digit code, zero-padded (e.g. "04829173"). */
    private String generateResetCode() {
        return String.format("%08d", SECURE_RANDOM.nextInt(100_000_000));
    }

    private String resetCodeKey(String normalizedEmail) {
        return "password_reset:code:" + normalizedEmail;
    }

    private String resetAttemptsKey(String normalizedEmail) {
        return "password_reset:attempts:" + normalizedEmail;
    }

    private void publishUserRegisteredEvent(User user, String username, String fullName) {
        try {
            UserRegisteredEvent event = UserRegisteredEvent.builder()
                    .userId(user.getId())
                    .email(user.getEmail())
                    .username(username)
                    .fullName(fullName)
                    .authProvider(user.getAuthProvider())
                    .build();

            byte[] payload = objectMapper.writeValueAsBytes(event);
            kafkaTemplate.send("user.registered", user.getId().toString(), payload);
            log.info("Published user.registered event for userId: {}", user.getId());

        } catch (Exception e) {
            log.error("Failed to publish user.registered event for userId: {}", user.getId(), e);
        }
    }
}