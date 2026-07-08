package com.codemates.githubsync.event;

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
public class GithubCommitSyncedEvent {
    private UUID userId;
    private int repositoriesSynced;
    private LocalDateTime timestamp;
}