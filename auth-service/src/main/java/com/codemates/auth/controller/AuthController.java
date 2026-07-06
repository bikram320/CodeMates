package com.codemates.auth.controller;

import com.codemates.auth.dto.*;
import com.codemates.auth.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Value("${jwt.expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpiration;

    // ─────────────────────────────────────
    // REGISTER
    // ─────────────────────────────────────
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserInfoResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        String ipAddress = getClientIp(httpRequest);
        AuthResponse authResponse = authService.register(request, ipAddress);

        setAuthCookies(response, authResponse);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful",
                        toUserInfo(authResponse)));
    }

    // ─────────────────────────────────────
    // LOGIN
    // ─────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<UserInfoResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        String ipAddress = getClientIp(httpRequest);
        String deviceInfo = httpRequest.getHeader("User-Agent");
        AuthResponse authResponse = authService.login(request, ipAddress, deviceInfo);

        setAuthCookies(response, authResponse);

        return ResponseEntity.ok(
                ApiResponse.success("Login successful", toUserInfo(authResponse)));
    }

    // ─────────────────────────────────────
    // REFRESH TOKEN
    // ─────────────────────────────────────
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<Void>> refresh(
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        // read refresh token from cookie — not request body
        String refreshToken = getCookieValue(httpRequest, "refresh_token");
        if (refreshToken == null) {
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Refresh token not found"));
        }

        String ipAddress = getClientIp(httpRequest);
        RefreshTokenRequest request2 = new RefreshTokenRequest();
        request2.setRefreshToken(refreshToken);

        AuthResponse authResponse = authService.refresh(request2, ipAddress);
        setAuthCookies(response, authResponse);

        return ResponseEntity.ok(
                ApiResponse.success("Token refreshed successfully", null));
    }

    // ─────────────────────────────────────
    // LOGOUT
    // ─────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        String refreshToken = getCookieValue(httpRequest, "refresh_token");
        if (refreshToken != null) {
            RefreshTokenRequest request2 = new RefreshTokenRequest();
            request2.setRefreshToken(refreshToken);
            authService.logout(request2);
        }

        clearAuthCookies(response);

        return ResponseEntity.ok(
                ApiResponse.success("Logged out successfully", null));
    }

    // ─────────────────────────────────────
    // LOGOUT ALL DEVICES
    // ─────────────────────────────────────
    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAllDevices(
            @AuthenticationPrincipal UUID userId,
            HttpServletResponse response) {

        authService.logoutAllDevices(userId);
        clearAuthCookies(response);

        return ResponseEntity.ok(
                ApiResponse.success("Logged out from all devices", null));
    }

    // ─────────────────────────────────────
    // FORGOT PASSWORD
    // ─────────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        authService.forgotPassword(request);
        return ResponseEntity.ok(
                ApiResponse.success(
                        "If this email is registered you will receive a reset link",
                        null));
    }

    // ─────────────────────────────────────
    // RESET PASSWORD
    // ─────────────────────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletResponse response) {

        authService.resetPassword(request);
        clearAuthCookies(response);

        return ResponseEntity.ok(
                ApiResponse.success("Password reset successful", null));
    }

    // ─────────────────────────────────────
    // HEALTH CHECK
    // ─────────────────────────────────────
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(
                ApiResponse.success("Auth service is running", null));
    }

    // ─────────────────────────────────────
    // INTERNAL — set both cookies
    // ─────────────────────────────────────
    private void setAuthCookies(HttpServletResponse response,
                                AuthResponse authResponse) {

        // access token cookie — short lived
        Cookie accessCookie = new Cookie("access_token",
                authResponse.getAccessToken());
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(false); // set true in production (HTTPS only)
        accessCookie.setPath("/");
        accessCookie.setMaxAge((int) (accessTokenExpiration / 1000));

        // refresh token cookie — long lived, restricted path
        Cookie refreshCookie = new Cookie("refresh_token",
                authResponse.getRefreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false); // set true in production
        refreshCookie.setPath("/api/auth/refresh");
        refreshCookie.setMaxAge((int) (refreshTokenExpiration / 1000));

        response.addCookie(accessCookie);
        response.addCookie(refreshCookie);
    }

    // ─────────────────────────────────────
    // INTERNAL — clear both cookies on logout
    // ─────────────────────────────────────
    private void clearAuthCookies(HttpServletResponse response) {
        Cookie accessCookie = new Cookie("access_token", "");
        accessCookie.setHttpOnly(true);
        accessCookie.setPath("/");
        accessCookie.setMaxAge(0);

        Cookie refreshCookie = new Cookie("refresh_token", "");
        refreshCookie.setHttpOnly(true);
        refreshCookie.setPath("/api/auth/refresh");
        refreshCookie.setMaxAge(0);

        response.addCookie(accessCookie);
        response.addCookie(refreshCookie);
    }

    // ─────────────────────────────────────
    // INTERNAL — read a cookie value by name
    // ─────────────────────────────────────
    private String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> c.getName().equals(name))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }

    // ─────────────────────────────────────
    // INTERNAL — only return non-sensitive
    // user info in response body
    // ─────────────────────────────────────
    private UserInfoResponse toUserInfo(AuthResponse authResponse) {
        return UserInfoResponse.builder()
                .userId(authResponse.getUserId())
                .email(authResponse.getEmail())
                .authProvider(authResponse.getAuthProvider())
                .build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}