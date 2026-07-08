package com.codemates.githubsync.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "repositories")
public class Repository {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @NotNull
    @Column(name = "github_profile_id", nullable = false)
    private UUID githubProfileId;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Size(max = 255)
    @NotNull
    @Column(name = "repo_name", nullable = false)
    private String repoName;

    @Size(max = 255)
    @NotNull
    @Column(name = "repo_full_name", nullable = false)
    private String repoFullName;

    @Size(max = 500)
    @NotNull
    @Column(name = "repo_url", nullable = false, length = 500)
    private String repoUrl;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @Size(max = 100)
    @Column(name = "primary_language", length = 100)
    private String primaryLanguage;

    @ColumnDefault("0")
    @Column(name = "stars_count")
    private Integer starsCount;

    @ColumnDefault("0")
    @Column(name = "forks_count")
    private Integer forksCount;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "is_private", nullable = false)
    private Boolean isPrivate = false;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "is_forked", nullable = false)
    private Boolean isForked = false;

    @Column(name = "last_pushed_at")
    private LocalDateTime lastPushedAt;

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

}