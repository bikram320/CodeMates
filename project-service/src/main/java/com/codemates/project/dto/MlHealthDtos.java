package com.codemates.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class MlHealthDtos {

    // ---- what we SEND to the FastAPI ml-service ----
    // NOTE: FastAPI/Pydantic side uses snake_case field names (project_id,
    // open_issues, etc). Jackson defaults to camelCase, so every field here
    // needs an explicit @JsonProperty or the two services silently won't
    // understand each other (FastAPI will 422 on the request).

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepoFeaturesDto {
        @JsonProperty("project_id")
        private String projectId; // UUID as string -- passthrough, matched back on response

        private Integer stars;
        private Integer forks;

        @JsonProperty("open_issues")
        private Integer openIssues;

        private Integer contributors;

        @JsonProperty("size_kb")
        private Double sizeKb;

        @JsonProperty("project_age_days")
        private Integer projectAgeDays;

        private String language;
        private String license; // nullable -- FastAPI side handles missing as "Unlicensed"
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchPredictRequestDto {
        private List<RepoFeaturesDto> repos;
    }

    // ---- what we RECEIVE from the FastAPI ml-service ----

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PredictionResultDto {
        @JsonProperty("project_id")
        private String projectId;

        @JsonProperty("abandon_probability")
        private Double abandonProbability;

        @JsonProperty("is_abandoned_pred")
        private Integer isAbandonedPred;

        @JsonProperty("health_status")
        private String healthStatus; // GREEN / YELLOW / RED
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BatchPredictResponseDto {
        private List<PredictionResultDto> results;
    }

    // ---- what OUR api returns to the frontend (GET /projects/{id}/health) ----

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectHealthResponse {
        private UUID projectId;
        private String healthStatus;      // GREEN / YELLOW / RED
        private Double abandonProbability;
        private Instant computedAt;
        private Boolean stale;
    }
}
