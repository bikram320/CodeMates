package com.codemates.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Same validation logic as every service's JwtCookieExtractor
 * (parserBuilder/setSigningKey/parseClaimsJws — jjwt 0.11.5 API, not the
 * 0.12.x verifyWith() syntax), minus the cookie-reading part. The gateway
 * runs on WebFlux, so cookie access happens via ServerWebExchange in
 * JwtAuthenticationGlobalFilter rather than HttpServletRequest here.
 *
 * ASSUMPTION carried over from JwtCookieExtractor: userId lives in the JWT
 * subject claim. If auth-service actually puts it in a custom claim
 * instead, fix it here AND in every JwtCookieExtractor copy.
 */
@Component
public class JwtValidator {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public UUID extractUserId(String token) {
        SecretKey key = Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));

        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        String userId = claims.getSubject();
        return UUID.fromString(userId);
    }
}
