package com.codemates.contribution.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.util.UUID;

/**
 * NEW entity, designed as part of contribution-service (not shared DB-first
 * like the others) because no existing service links a github-sync-service
 * Repository to a CodeMates project. Repository/CommitStat there are scoped
 * to (userId, repositoryId) only — account-wide, not project-aware.
 *
 * lastKnownTotalCommits lets us award points only for NEW commits since
 * CommitStat.totalCommits is cumulative, not incremental.
 */
@lombok.Getter
@lombok.Setter
@Entity
@Table(name = "project_repository_links")
public class ProjectRepositoryLink {

    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull
    @Column(name = "repository_id", nullable = false)
    private UUID repositoryId;

    @NotNull
    @ColumnDefault("0")
    @Column(name = "last_known_total_commits", nullable = false)
    private Integer lastKnownTotalCommits = 0;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @NotNull
    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
