package com.codemates.contribution.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MlContributionPairDto {
    @JsonProperty("user_id")
    private String userId;

    @JsonProperty("project_id")
    private String projectId;

    private MlDeveloperProfileDto developer;
    private MlProjectContextDto project;
}
