package com.codemates.messaging.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.UUID;

/**
 * NOTE: Recreated from the pattern described across services (jjwt 0.11.5 API:
 * parserBuilder/setSigningKey/parseClaimsJws). I was not given the canonical
 * source file for this class, so please diff this against your existing copy
 * in another service and swap in the real one if anything differs (claim key
 * names, cookie name, etc.) — see README.
 */
@Component
public class JwtCookieExtractor {

    private static final String COOKIE_NAME = "accessToken";

    @Value("${jwt.secret}")
    private String jwtSecret;

    public UUID extractUserId(HttpServletRequest request) {
        String token = extractToken(request);
        Claims claims = parseClaims(token);
        return UUID.fromString(claims.getSubject());
    }

    public String extractToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            throw new IllegalStateException("No cookies present on request");
        }
        for (Cookie cookie : cookies) {
            if (COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        throw new IllegalStateException("Missing " + COOKIE_NAME + " cookie");
    }

    public UUID extractUserIdFromToken(String token) {
        Claims claims = parseClaims(token);
        return UUID.fromString(claims.getSubject());
    }

    private Claims parseClaims(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
