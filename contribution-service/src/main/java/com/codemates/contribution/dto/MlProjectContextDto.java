package com.codemates.contribution.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

/**
 * "project" object inside one pair sent to ml-service's
 * /predict/contribution/batch.
 */
@Data
@Builder
public class MlProjectContextDto {
    @JsonProperty("project_id")
    private String projectId;

    private Integer stars;
    private Integer forks;
    private Integer subscribers;

    @JsonProperty("topic_count")
    private Integer topicCount;

    private String language;
}
