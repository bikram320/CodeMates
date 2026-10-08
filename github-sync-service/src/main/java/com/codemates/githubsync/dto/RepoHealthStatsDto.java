package com.codemates.githubsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepoHealthStatsDto {
    private String repoFullName;
    private Integer stars;
    private Integer forks;
    private Integer openIssues;
    private Integer contributors;
    private Integer sizeKb;
    private Integer projectAgeDays;
    private String language;
    private String license; // may be null -- ml-service already treats missing license as "Unlicensed"
}