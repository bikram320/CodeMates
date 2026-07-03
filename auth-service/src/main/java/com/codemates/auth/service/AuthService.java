package com.codemates.auth.service;

import com.codemates.auth.dto.*;
import com.codemates.auth.event.UserRegisteredEvent;
import com.codemates.auth.exception.InvalidTokenException;
import com.codemates.auth.exception.UserAlreadyExistsException;
import com.codemates.auth.model.User;
import com.codemates.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final KafkaTemplate<String, byte[]> kafkaTemplate;
    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    // REGISTER
    @Transactional
    public AuthResponse register(RegisterRequest request, String ipAddress) {

        // 1. check if email already taken
        if (userRepository.existsByEmailAndIsDeletedFalse(request.getEmail())) {
            throw new UserAlreadyExistsException("Email already registered: " + request.getEmail());
        }

        // 2. build and save user
        User user = User.builder()
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .authProvider("LOCAL")
                .isActive(true)
                .isDeleted(false)
                .build();

        User savedUser = userRepository.save(user);
        log.info("New user registered: {}", savedUser.getEmail());

        // 3. publish Kafka event — user-profile-service will consume this
        //    and auto-create a profile row
        publishUserRegisteredEvent(savedUser, request.getUsername(), request.getFullName());

        // 4. generate tokens
        String accessToken = jwtService.generateAccessToken(savedUser.getId(), savedUser.getEmail());
        String refreshToken = refreshTokenService.createRefreshToken(
                savedUser.getId(),
                "Registration",
                ipAddress
        );

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
    public void forgotPassword(ForgotPasswordRequest request) {

        // 1. check user exists — but don't reveal if they don't
        //    (security best practice — never confirm email existence)
        userRepository.findByEmailAndIsDeletedFalse(request.getEmail())
                .ifPresent(user -> {
                    // 2. generate reset token
                    String resetToken = UUID.randomUUID().toString();

                    // 3. store in Redis with 15 minute TTL
                    String redisKey = "password_reset:" + resetToken;
                    redisTemplate.opsForValue().set(
                            redisKey,
                            user.getId().toString(),
                            Duration.ofMinutes(15)
                    );

                    // 4. in real app — send email with reset link containing token
                    //    for now we log it (email service comes in Phase 5)
                    log.info("Password reset token for {}: {}", user.getEmail(), resetToken);
                });
    }

    // RESET PASSWORD
    @Transactional
    public void resetPassword(ResetPasswordRequest request) {

        // 1. look up token in Redis
        String redisKey = "password_reset:" + request.getToken();
        String userIdStr = redisTemplate.opsForValue().get(redisKey);

        if (userIdStr == null) {
            throw new InvalidTokenException("Password reset token is invalid or expired");
        }

        // 2. load user
        UUID userId = UUID.fromString(userIdStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new InvalidTokenException("User not found"));

        // 3. update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        // 4. delete token from Redis so it can't be reused
        redisTemplate.delete(redisKey);

        // 5. revoke all refresh tokens — force re-login everywhere
        refreshTokenService.revokeAllTokensForUser(userId);

        log.info("Password reset successful for userId: {}", userId);
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