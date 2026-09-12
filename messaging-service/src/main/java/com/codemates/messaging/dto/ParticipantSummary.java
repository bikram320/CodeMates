package com.codemates.messaging.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ParticipantSummary {
    private UUID userId;
    private Instant lastReadAt;
    private Boolean isMuted;
}
