package com.codemates.githubsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Everything Model 1 (Developer Matching) needs for one developer.
 * Returned by GithubSyncService.getDeveloperSkillProfile(userId).
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeveloperSkillProfileDto {
    private String userId;
    private List<String> languages;      // every language across all their synced repos
    private List<String> topics;         // every topic across all their synced repos
    private String primaryLanguage;      // their single most-used language
    private Integer publicRepos;
    private Integer publicGists;
    private Integer followers;
    private Integer following;
    private Integer accountAgeDays;      // precomputed here, matches Model 2's projectAgeDays pattern
}
