package com.codemates.contribution.event.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Mirrors github-sync-service's GithubCommitSyncedEvent exactly (same
 * field names/types, so Jackson maps it directly): userId,
 * repositoriesSynced, timestamp.
 */
@Data
public class GithubCommitSyncedEvent {
    private UUID userId;
    private int repositoriesSynced;
    private LocalDateTime timestamp;
}
