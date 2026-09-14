package com.codemates.notification.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;

@Getter
@Builder
public class NotificationPageResponse {
    private List<NotificationResponse> notifications;
    private Instant nextCursor; // pass as ?before= on the next request; null when no more pages
    private boolean hasMore;
}
