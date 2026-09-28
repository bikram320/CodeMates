package com.codemates.githubsync.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
@Table(name = "github_profiles")
public class GithubProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Size(max = 100)
    @NotNull
    @Column(name = "github_username", nullable = false, length = 100)
    private String githubUsername;

    @Size(max = 100)
    @NotNull
    @Column(name = "github_user_id", nullable = false, length = 100)
    private String githubUserId;

    @Size(max = 500)
    @Column(name = "github_access_token", length = 500)
    private String githubAccessToken;

    @Size(max = 500)
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Column(name = "bio", length = Integer.MAX_VALUE)
    private String bio;

    @ColumnDefault("0")
    @Column(name = "public_repos_count")
    private Integer publicReposCount;

    @ColumnDefault("0")
    @Column(name = "followers_count")
    private Integer followersCount;

    @ColumnDefault("0")
    @Column(name = "following_count")
    private Integer followingCount;

    @Column(name = "last_synced_at")
    private LocalDateTime lastSyncedAt;

    @NotNull
    @ColumnDefault("false")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @NotNull
    @CreationTimestamp
    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @NotNull
    @UpdateTimestamp
    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @ColumnDefault("0")
    @Column(name = "public_gists_count")
    private Integer publicGistsCount;

    @Column(name = "account_created_at")
    private LocalDateTime accountCreatedAt; // GitHub account creation date -- NOT this row's own created_at above

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