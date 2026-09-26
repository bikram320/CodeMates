package com.codemates.contribution.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ContributionScoreResponse {
    private UUID userId;
    private UUID projectId;
    private Integer tasksCompleted;
    private Integer tasksReviewed;
    private Integer messagesSent;
    private Integer commitsCount;
    private Integer filesShared;
    private BigDecimal totalScore;
    private Instant lastCalculatedAt;

    // Model 3 -- predicted likelihood of becoming a significant contributor,
    // separate from totalScore (see ContributionMlSyncService for why).
    // Null until a prediction sync has run for this user/project.
    private Double significanceProbability;
    private Instant significancePredictedAt;
}
