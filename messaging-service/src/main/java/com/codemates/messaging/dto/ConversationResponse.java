package com.codemates.messaging.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class ConversationResponse {
    private UUID id;
    private String type;
    private UUID projectId;
    private UUID createdByUserId;
    private Instant lastMessageAt;
    private String lastMessagePreview;
    private List<ParticipantSummary> participants;
    private Instant createdAt;
}
