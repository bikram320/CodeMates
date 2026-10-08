package com.codemates.contribution.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class MlContributionResultDto {
    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("project_id")
    private String projectId;

    @JsonProperty("significance_probability")
    private Double significanceProbability;

    @JsonProperty("predicted_significant")
    private Integer predictedSignificant;
}
