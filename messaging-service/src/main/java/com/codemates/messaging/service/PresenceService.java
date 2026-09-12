package com.codemates.messaging.service;

import com.codemates.messaging.dto.PresenceBroadcast;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory presence tracking, scoped to this service instance. A user can
 * have multiple sessions open (multiple tabs/devices); they only go OFFLINE
 * once their last session disconnects. This is fine for a single instance;
 * if messaging-service is ever scaled horizontally this needs to move to
 * Redis (you already run Redis for other services) so presence is shared
 * across instances.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final SimpMessagingTemplate messagingTemplate;

    // userId -> set of active STOMP session ids
    private final Map<UUID, Set<String>> onlineUsers = new ConcurrentHashMap<>();

    @EventListener
    public void handleConnected(SessionConnectedEvent event) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        UUID userId = resolveUserId(accessor);
        String sessionId = accessor.getSessionId();
        if (userId == null || sessionId == null) return;

        boolean wasOffline = onlineUsers.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).isEmpty();
        onlineUsers.get(userId).add(sessionId);

        if (wasOffline) {
            log.info("User {} came online (session {})", userId, sessionId);
            messagingTemplate.convertAndSend("/topic/presence", new PresenceBroadcast(userId, "ONLINE"));
        }
    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        SimpMessageHeaderAccessor accessor = SimpMessageHeaderAccessor.wrap(event.getMessage());
        UUID userId = resolveUserId(accessor);
        String sessionId = accessor.getSessionId();
        if (userId == null || sessionId == null) return;

        Set<String> sessions = onlineUsers.get(userId);
        if (sessions == null) return;

        sessions.remove(sessionId);
        if (sessions.isEmpty()) {
            onlineUsers.remove(userId);
            log.info("User {} went offline", userId);
            messagingTemplate.convertAndSend("/topic/presence", new PresenceBroadcast(userId, "OFFLINE"));
        }
    }

    public boolean isOnline(UUID userId) {
        Set<String> sessions = onlineUsers.get(userId);
        return sessions != null && !sessions.isEmpty();
    }

    private UUID resolveUserId(SimpMessageHeaderAccessor accessor) {
        if (accessor.getUser() == null) return null;
        try {
            return UUID.fromString(accessor.getUser().getName());
        } catch (IllegalArgumentException e) {
            return null;
        }
    }
}
