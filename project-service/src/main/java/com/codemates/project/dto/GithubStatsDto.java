package com.codemates.project.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class GithubStatsDto {

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RepoStats {
        private String repoFullName;
        private Integer stars;
        private Integer forks;
        private Integer openIssues;
        private Integer contributors;
        private Integer sizeKb;
        private Integer projectAgeDays;
        private String language;
        private String license;
    }

    // matches github-sync-service's ApiResponse<T> wrapper: { success, message, data }
    // "success" is intentionally not declared here -- ignoreUnknown handles it,
    // and we don't need the flag since a 404/error already throws before we
    // ever try to deserialize a failure response as this type.
    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Wrapped {
        private String message;
        private RepoStats data;
    }
}