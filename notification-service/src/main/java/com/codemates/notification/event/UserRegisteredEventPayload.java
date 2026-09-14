package com.codemates.notification.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Mirrors com.codemates.auth.event.UserRegisteredEvent's JSON shape. This is a separate
 * class on purpose (consumer-side DTOs are independent of the producer's class) so
 * notification-service doesn't need a shared library dependency on auth-service.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserRegisteredEventPayload {
    private UUID userId;
    private String email;
    private String username;
    private String fullName;
    private String authProvider;
}
