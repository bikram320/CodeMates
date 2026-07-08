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
public class GithubProfileResponseDto {
    private String githubUsername;
    private String avatarUrl;
    private String bio;
    private Integer publicReposCount;
    private Integer followersCount;
    private Integer followingCount;
    private LocalDateTime lastSyncedAt;
}