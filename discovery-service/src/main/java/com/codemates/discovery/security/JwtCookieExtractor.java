package com.codemates.discovery.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Arrays;
import java.util.UUID;

@Component
public class JwtCookieExtractor {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public UUID extractUserId(HttpServletRequest request) {
        String token = getCookieValue(request, "access_token");
        if (token == null) {
            throw new IllegalArgumentException("User not authenticated: access_token cookie missing");
        }

        try {
            SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String userId = claims.getSubject();
            return UUID.fromString(userId);

        } catch (JwtException | IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid or expired access token", e);
        }
    }

    private String getCookieValue(HttpServletRequest request, String name) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> c.getName().equals(name))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
