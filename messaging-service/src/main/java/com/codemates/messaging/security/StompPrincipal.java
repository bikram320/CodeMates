package com.codemates.messaging.security;

import java.security.Principal;
import java.util.UUID;

/**
 * Wraps the authenticated userId as a Principal so Spring's STOMP session
 * (and SimpMessagingTemplate's user-destination features, if used later)
 * can identify who's connected. accessor.getUser().getName() will return
 * the userId's string form.
 */
public record StompPrincipal(UUID userId) implements Principal {
    @Override
    public String getName() {
        return userId.toString();
    }
}
