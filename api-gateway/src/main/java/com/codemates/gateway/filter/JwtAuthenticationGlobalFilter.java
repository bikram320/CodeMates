package com.codemates.gateway.filter;

import com.codemates.gateway.security.JwtValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

/**
 * Fail-fast JWT check at the edge, PLUS every downstream service still
 * validates the same cookie itself — chosen deliberately as defense in
 * depth rather than picking one or the other.
 *
 * Cookie name is "access_token" (confirmed: this is what AuthController
 * actually sets). NOTE: as of this writing, JwtCookieExtractor reads
 * "accessToken" (camelCase, no underscore) in every service that copied
 * it — that's a bug, it will never find the cookie the browser actually
 * has. Fix every copy of JwtCookieExtractor to read "access_token".
 */
@Component
@RequiredArgsConstructor
public class JwtAuthenticationGlobalFilter implements GlobalFilter, Ordered {

    private final JwtValidator jwtValidator;
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final String ACCESS_TOKEN_COOKIE = "access_token";

    // Sourced from auth-service's SecurityConfig permitAll() list.
    // Keep this in sync if that list ever changes.
    private static final List<String> PUBLIC_PATHS = List.of(
            "/api/auth/register",
            "/api/auth/login",
            "/api/auth/refresh",
            "/api/auth/forgot-password",
            "/api/auth/reset-password",
            "/api/auth/github",
            "/api/auth/github/callback",
            "/api/auth/health"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();

        // CORS preflight never carries cookies — let it through untouched
        // or every preflight would 401 and the browser would block the
        // real request before it's even sent.
        if (request.getMethod() == HttpMethod.OPTIONS) {
            return chain.filter(exchange);
        }

        String path = request.getURI().getPath();
        if (isPublic(path)) {
            return chain.filter(exchange);
        }

        HttpCookie cookie = request.getCookies().getFirst(ACCESS_TOKEN_COOKIE);
        if (cookie == null) {
            return unauthorized(exchange, "No access token cookie found");
        }

        UUID userId;
        try {
            userId = jwtValidator.extractUserId(cookie.getValue());
        } catch (Exception e) {
            return unauthorized(exchange, "Invalid or expired access token");
        }

        // Forward the resolved userId as a convenience header. Every
        // service still validates the cookie itself too, so this is not a
        // trust shortcut — just saves downstream services re-parsing the
        // JWT if they want to use it.
        ServerHttpRequest mutated = request.mutate()
                .header("X-User-Id", userId.toString())
                .build();

        return chain.filter(exchange.mutate().request(mutated).build());
    }

    private boolean isPublic(String path) {
        return PUBLIC_PATHS.stream().anyMatch(p -> pathMatcher.match(p, path));
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().add("Content-Type", "application/json");

        // Local best-effort shape matching the ApiResponse<T> convention
        // (success/message/data) described in the project conventions —
        // I don't have the real ApiResponse<T> class to import here since
        // the gateway has no shared-library dependency on it. Paste it in
        // and swap this out if the real shape differs.
        String body = "{\"success\":false,\"message\":\"" + message + "\",\"data\":null}";

        var buffer = exchange.getResponse().bufferFactory()
                .wrap(body.getBytes(StandardCharsets.UTF_8));
        return exchange.getResponse().writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        // Must run before Gateway's routing/websocket filters (which sit
        // near Ordered.LOWEST_PRECEDENCE), and before the RequestRateLimiter
        // filter, since the rate limiter's key resolver reads the
        // X-User-Id header this filter sets.
        return Ordered.HIGHEST_PRECEDENCE + 10;
    }
}
