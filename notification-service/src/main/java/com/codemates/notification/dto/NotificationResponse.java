package com.codemates.notification.dto;

import com.codemates.notification.model.Notification;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class NotificationResponse {
    private UUID id;
    private UUID senderUserId;
    private String type;
    private String title;
    private String body;
    private UUID referenceId;
    private String referenceType;
    private boolean isRead;
    private Instant readAt;
    private Instant createdAt;

    public static NotificationResponse from(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .senderUserId(n.getSenderUserId())
                .type(n.getType())
                .title(n.getTitle())
                .body(n.getBody())
                .referenceId(n.getReferenceId())
                .referenceType(n.getReferenceType())
                .isRead(Boolean.TRUE.equals(n.getIsRead()))
                .readAt(n.getReadAt())
                .createdAt(n.getCreatedAt())
                .build();
    }
}
