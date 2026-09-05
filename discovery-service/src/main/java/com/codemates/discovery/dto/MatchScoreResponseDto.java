package com.codemates.discovery.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class MatchScoreResponseDto {
    private UUID id;
    private UUID userId;
    private UUID matchedUserId;
    private BigDecimal skillScore;
    private BigDecimal experienceScore;
    private BigDecimal activityScore;
    private BigDecimal interestScore;
    private BigDecimal totalMatchScore;
    private Instant lastCalculatedAt;
}
