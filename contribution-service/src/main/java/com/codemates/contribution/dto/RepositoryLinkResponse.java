package com.codemates.contribution.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class RepositoryLinkResponse {
    private UUID id;
    private UUID projectId;
    private UUID userId;
    private UUID repositoryId;
    private Integer lastKnownTotalCommits;
}
