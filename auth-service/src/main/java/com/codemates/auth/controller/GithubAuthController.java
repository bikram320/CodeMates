package com.codemates.auth.controller;

import com.codemates.auth.dto.AuthResponse;
import com.codemates.auth.service.AuthService;
import com.codemates.auth.service.GithubOAuthService;
import com.codemates.auth.service.GithubOAuthService.GithubOAuthUserDto;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.UUID;

/**
 * Fills the two paths SecurityConfig / the gateway already permitAll() for:
 * GET /api/auth/github and GET /api/auth/github/callback.
 *
 * This is a *redirect-based* flow (standard OAuth), not a JSON API — the
 * browser is sent to GitHub, then GitHub redirects back here, then this
 * redirects the browser to your frontend with cookies already set. Point a
 * "Continue with GitHub" button's href straight at GET /api/auth/github —
 * don't fetch() it.
 */
@Slf4j
@RestController
@RequestMapping("/api/auth/github")
@RequiredArgsConstructor
public class GithubAuthController {

    private final GithubOAuthService githubOAuthService;
    private final AuthService authService;

    @Value("${jwt.expiration}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-expiration}")
    private long refreshTokenExpiration;

    @Value("${frontend.oauth-success-redirect}")
    private String frontendSuccessRedirect;

    @Value("${frontend.oauth-failure-redirect}")
    private String frontendFailureRedirect;

    @GetMapping
    public ResponseEntity<Void> redirectToGithub(HttpServletResponse response) {
        String state = UUID.randomUUID().toString();

        Cookie stateCookie = new Cookie("oauth_state", state);
        stateCookie.setHttpOnly(true);
        stateCookie.setPath("/api/auth/github");
        stateCookie.setMaxAge(300); // 5 minutes
        response.addCookie(stateCookie);

        return ResponseEntity.status(HttpStatus.FOUND)
                .location(URI.create(githubOAuthService.buildAuthorizeUrl(state)))
                .build();
    }

    @GetMapping("/callback")
    public ResponseEntity<Void> callback(
            @RequestParam String code,
            @RequestParam(required = false) String state,
            @CookieValue(name = "oauth_state", required = false) String expectedState,
            HttpServletRequest httpRequest,
            HttpServletResponse response) {

        if (expectedState == null || !expectedState.equals(state)) {
            log.warn("GitHub OAuth state mismatch — rejecting callback");
            return redirect(frontendFailureRedirect + "?error=state_mismatch");
        }

        try {
            String githubAccessToken = githubOAuthService.exchangeCodeForAccessToken(code);
            GithubOAuthUserDto githubUser = githubOAuthService.fetchGithubUser(githubAccessToken);

            String email = githubUser.getEmail() != null
                    ? githubUser.getEmail()
                    : githubOAuthService.fetchPrimaryVerifiedEmail(githubAccessToken);

            if (email == null) {
                return redirect(frontendFailureRedirect + "?error=no_verified_email");
            }

            String ipAddress = getClientIp(httpRequest);
            String githubUserId = String.valueOf(githubUser.getId());
            AuthResponse authResponse = authService.loginOrRegisterWithGithub(
                    email, githubUser.getLogin(), githubUser.getName(), githubUserId, ipAddress);

            setAuthCookies(response, authResponse);
            return redirect(frontendSuccessRedirect);

        } catch (Exception e) {
            log.error("GitHub OAuth callback failed", e);
            return redirect(frontendFailureRedirect + "?error=oauth_failed");
        }
    }

    private ResponseEntity<Void> redirect(String location) {
        return ResponseEntity.status(HttpStatus.FOUND).location(URI.create(location)).build();
    }

    private void setAuthCookies(HttpServletResponse response, AuthResponse authResponse) {
        Cookie accessCookie = new Cookie("access_token", authResponse.getAccessToken());
        accessCookie.setHttpOnly(true);
        accessCookie.setSecure(false); // set true in production (HTTPS only)
        accessCookie.setPath("/");
        accessCookie.setMaxAge((int) (accessTokenExpiration / 1000));

        Cookie refreshCookie = new Cookie("refresh_token", authResponse.getRefreshToken());
        refreshCookie.setHttpOnly(true);
        refreshCookie.setSecure(false);
        refreshCookie.setPath("/api/auth/refresh");
        refreshCookie.setMaxAge((int) (refreshTokenExpiration / 1000));

        response.addCookie(accessCookie);
        response.addCookie(refreshCookie);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}