package com.codemates.contribution.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ContributionEventResponse {
    private UUID id;
    private UUID userId;
    private UUID projectId;
    private String eventType;
    private BigDecimal pointsAwarded;
    private UUID referenceId;
    private String referenceType;
    private String description;
    private Instant createdAt;
}
