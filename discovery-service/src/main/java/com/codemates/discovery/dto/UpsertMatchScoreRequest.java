package com.codemates.discovery.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Used to write/update a match score between two users.
 * Intended to be called by the future ML recommendation engine —
 * built now so the storage layer is ready before the model exists.
 * Scores are expected on a 0-100 scale.
 */
@Data
public class UpsertMatchScoreRequest {
    @NotNull
    private UUID userId;

    @NotNull
    private UUID matchedUserId;

    @DecimalMin("0.0") @DecimalMax("100.0")
    private BigDecimal skillScore;

    @DecimalMin("0.0") @DecimalMax("100.0")
    private BigDecimal experienceScore;

    @DecimalMin("0.0") @DecimalMax("100.0")
    private BigDecimal activityScore;

    @DecimalMin("0.0") @DecimalMax("100.0")
    private BigDecimal interestScore;
}
