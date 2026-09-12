package com.codemates.messaging.security;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;
import java.util.UUID;

/**
 * Runs during the HTTP -> WebSocket upgrade, before any STOMP frame exists.
 * The upgrade request still carries the browser's cookies, so we pull the
 * JWT the same way REST controllers do via JwtCookieExtractor, then stash
 * the userId in the WebSocket session attributes. StompAuthChannelInterceptor
 * later reads it from there to set the Principal on the STOMP CONNECT frame.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    public static final String USER_ID_ATTRIBUTE = "userId";

    private final JwtCookieExtractor jwtCookieExtractor;

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                    WebSocketHandler wsHandler, Map<String, Object> attributes) {
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }

        HttpServletRequest httpRequest = servletRequest.getServletRequest();
        try {
            UUID userId = jwtCookieExtractor.extractUserId(httpRequest);
            attributes.put(USER_ID_ATTRIBUTE, userId);
            return true;
        } catch (Exception e) {
            log.warn("Rejected WebSocket handshake: {}", e.getMessage());
            response.setStatusCode(org.springframework.http.HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                WebSocketHandler wsHandler, Exception exception) {
        // no-op
    }
}
