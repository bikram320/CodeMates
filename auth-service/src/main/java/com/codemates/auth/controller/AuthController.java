package com.codemates.auth.controller;

import com.codemates.auth.dto.*;
import com.codemates.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    // REGISTER
    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        AuthResponse response = authService.register(request, ipAddress);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Registration successful", response));
    }

    // LOGIN
    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        String deviceInfo = httpRequest.getHeader("User-Agent");
        AuthResponse response = authService.login(request, ipAddress, deviceInfo);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("Login successful", response));
    }

    // REFRESH TOKEN
    // POST /api/auth/refresh
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request,
            HttpServletRequest httpRequest) {

        String ipAddress = getClientIp(httpRequest);
        AuthResponse response = authService.refresh(request, ipAddress);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("Token refreshed successfully", response));
    }

    // LOGOUT
    // POST /api/auth/logout
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @Valid @RequestBody RefreshTokenRequest request) {

        authService.logout(request);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("Logged out successfully", null));
    }

    // LOGOUT FROM ALL DEVICES
    // POST /api/auth/logout-all
    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAllDevices(
            @AuthenticationPrincipal UUID userId) {

        authService.logoutAllDevices(userId);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("Logged out from all devices", null));
    }


    // FORGOT PASSWORD
    // POST /api/auth/forgot-password
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        authService.forgotPassword(request);

        // always return success — never reveal if email exists
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success(
                        "If this email is registered you will receive a reset link",
                        null
                ));
    }

    // RESET PASSWORD
    // POST /api/auth/reset-password
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        authService.resetPassword(request);

        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("Password reset successful", null));
    }

    // GITHUB OAUTH — redirect to GitHub
    // GET /api/auth/github
    @GetMapping("/github")
    public ResponseEntity<ApiResponse<String>> githubLogin() {

        // placeholder — full OAuth flow in Phase 5
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("GitHub OAuth coming in Phase 5", null));
    }

    // GITHUB OAUTH — callback handler
    // GET /api/auth/github/callback
    @GetMapping("/github/callback")
    public ResponseEntity<ApiResponse<String>> githubCallback(
            @RequestParam String code) {

        // placeholder — full OAuth flow in Phase 5
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("GitHub OAuth callback coming in Phase 5", null));
    }

    // HEALTH CHECK
    // GET /api/auth/health
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity
                .status(HttpStatus.OK)
                .body(ApiResponse.success("Auth service is running", null));
    }

    // INTERNAL — extract real client IP
    // handles proxies and load balancers
    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}