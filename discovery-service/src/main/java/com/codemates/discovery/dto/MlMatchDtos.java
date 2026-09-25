package com.codemates.discovery.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

public class MlMatchDtos {

    // ---- what we SEND to ml-service ---- (snake_case via @JsonProperty, matches FastAPI/Pydantic)

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DeveloperSkillProfileRequest {
        @JsonProperty("user_id")
        private String userId;

        private List<String> languages;
        private List<String> topics;

        @JsonProperty("primary_language")
        private String primaryLanguage;

        @JsonProperty("public_repos")
        private Integer publicRepos;

        @JsonProperty("public_gists")
        private Integer publicGists;

        private Integer followers;
        private Integer following;

        @JsonProperty("account_age_days")
        private Integer accountAgeDays;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchPairDto {
        @JsonProperty("user_id")
        private String userId;

        @JsonProperty("candidate_id")
        private String candidateId;

        @JsonProperty("dev_a")
        private DeveloperSkillProfileRequest devA;

        @JsonProperty("dev_b")
        private DeveloperSkillProfileRequest devB;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchBatchPredictRequestDto {
        private List<MatchPairDto> pairs;
    }

    // ---- what we RECEIVE from ml-service ----

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchPredictionResultDto {
        @JsonProperty("user_id")
        private String userId;

        @JsonProperty("candidate_id")
        private String candidateId;

        @JsonProperty("match_probability")
        private Double matchProbability;

        @JsonProperty("predicted_match")
        private Integer predictedMatch;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MatchBatchPredictResponseDto {
        private List<MatchPredictionResultDto> results;
    }
}
