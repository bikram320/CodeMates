package com.codemates.notification.event;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Mirrors GithubSyncEventProducer's payload: {userId, repositoriesSynced, timestamp}.
 * "timestamp" is deliberately omitted here - it's a LocalDateTime on the producer side and
 * we don't know how it's registered with that ObjectMapper (could serialize as an ISO string
 * or as a numeric array depending on JavaTimeModule config). We don't need it for the
 * notification body, so we ignore it rather than guess the format. ignoreUnknown=true means
 * this won't break if it's present in an unexpected shape.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class GithubCommitSyncedPayload {
    private UUID userId;
    private int repositoriesSynced;
}
