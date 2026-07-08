package com.codemates.githubsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CommitStatResponseDto {
    private Integer totalCommits;
    private Integer commitsLast30Days;
    private Integer commitsLast7Days;
    private LocalDateTime lastCommitAt;
}