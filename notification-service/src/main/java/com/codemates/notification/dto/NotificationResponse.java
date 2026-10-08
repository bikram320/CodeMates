package com.codemates.notification.dto;

import com.codemates.notification.model.Notification;
import com.fasterxml.jackson.annotation.JsonGetter;
import lombok.AccessLevel;
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

    // Lombok normally generates `isRead()` for this field, and Jackson can then
    // serialize it as "read" (stripping the "is" prefix from the getter name)
    // instead of "isRead". To remove that ambiguity entirely, we skip Lombok's
    // generated getter for this field and declare the getter explicitly below,
    // pinning the JSON key with @JsonGetter.
    @Getter(AccessLevel.NONE)
    private boolean isRead;

    private Instant readAt;
    private Instant createdAt;

    @JsonGetter("isRead")
    public boolean isRead() {
        return isRead;
    }

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