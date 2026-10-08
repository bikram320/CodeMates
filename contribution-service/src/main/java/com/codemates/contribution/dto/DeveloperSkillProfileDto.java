package com.codemates.contribution.dto;

import lombok.Data;

import java.util.List;

/**
 * Mirror of github-sync-service's DeveloperSkillProfileDto (already built
 * for Model 1). Fetched via GithubSyncServiceClient.getSkillProfile(userId).
 */
@Data
public class DeveloperSkillProfileDto {
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
