package com.codemates.githubsync.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "commit_stats")
public class CommitStat {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull
    @Column(name = "repository_id", nullable = false)
    private UUID repositoryId;

    @ColumnDefault("0")
    @Column(name = "total_commits")
    private Integer totalCommits;

    @ColumnDefault("0")
    @Column(name = "commits_last_30_days")
    private Integer commitsLast30Days;

    @ColumnDefault("0")
    @Column(name = "commits_last_7_days")
    private Integer commitsLast7Days;

    @Column(name = "last_commit_at")
    private LocalDateTime lastCommitAt;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

}