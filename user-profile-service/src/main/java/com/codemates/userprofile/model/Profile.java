package com.codemates.userprofile.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "profiles", schema = "user_profile_schema")
public class Profile {

    @Id
    @GeneratedValue
    @UuidGenerator
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Size(max = 50)
    @NotNull
    @Column(name = "username", nullable = false, length = 50, unique = true)
    private String username;

    @Size(max = 100)
    @Column(name = "full_name", length = 100)
    private String fullName;

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio;

    @Size(max = 500)
    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Size(max = 20)
    @NotNull
    @Column(name = "experience_level", nullable = false, length = 20)
    private String experienceLevel = "BEGINNER";

    @Size(max = 500)
    @Column(name = "portfolio_url", length = 500)
    private String portfolioUrl;

    @Size(max = 500)
    @Column(name = "linkedin_url", length = 500)
    private String linkedinUrl;

    @Size(max = 100)
    @Column(name = "github_username", length = 100)
    private String githubUsername;

    @NotNull
    @Column(name = "is_open_to_collaborate", nullable = false)
    private Boolean isOpenToCollaborate = true;   // fixed: was false

    @Size(max = 20)
    @NotNull
    @Column(name = "activity_status", nullable = false, length = 20)
    private String activityStatus = "ACTIVE";

    @NotNull
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @NotNull
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @NotNull
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}