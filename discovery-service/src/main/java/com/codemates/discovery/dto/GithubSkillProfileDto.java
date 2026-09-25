package com.codemates.discovery.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

public class GithubSkillProfileDto {

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Data {
        private String userId;
        private List<String> languages;
        private List<String> topics;
        private String primaryLanguage;
        private Integer publicRepos;
        private Integer publicGists;
        private Integer followers;
        private Integer following;
        private Integer accountAgeDays;
    }

    // matches github-sync-service's ApiResponse<T> wrapper: { success, message, data }
    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Wrapped {
        private String message;
        private Data data;
    }
}
