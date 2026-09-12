package com.codemates.messaging.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            Object userIdAttr = accessor.getSessionAttributes() != null
                    ? accessor.getSessionAttributes().get(JwtHandshakeInterceptor.USER_ID_ATTRIBUTE)
                    : null;

            if (userIdAttr instanceof UUID userId) {
                accessor.setUser(new StompPrincipal(userId));
            } else {
                log.warn("STOMP CONNECT with no userId in session attributes; rejecting");
                throw new IllegalStateException("Unauthenticated WebSocket CONNECT");
            }
        }

        return message;
    }
}
