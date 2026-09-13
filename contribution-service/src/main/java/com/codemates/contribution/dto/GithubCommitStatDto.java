package com.codemates.contribution.dto;

import lombok.Data;

/**
 * Mirror of github-sync-service's CommitStatResponseDto.
 */
@Data
public class GithubCommitStatDto {
    private Integer totalCommits;
    private Integer commitsLast30Days;
    private Integer commitsLast7Days;
}
