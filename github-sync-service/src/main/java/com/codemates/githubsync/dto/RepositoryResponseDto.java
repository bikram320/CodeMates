package com.codemates.githubsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryResponseDto {
    private UUID id;
    private String repoName;
    private String repoFullName;
    private String repoUrl;
    private String primaryLanguage;
    private Integer starsCount;
    private Integer forksCount;
    private Boolean isPrivate;
    private Boolean isForked;
    private LocalDateTime lastPushedAt;
}