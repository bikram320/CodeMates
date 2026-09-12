package com.codemates.messaging.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class MessageResponse {
    private UUID id;
    private UUID conversationId;
    private UUID senderUserId;
    private String content;
    private String messageType;
    private String fileUrl;
    private String fileName;
    private Boolean isEdited;
    private Instant editedAt;
    private Instant createdAt;
}
