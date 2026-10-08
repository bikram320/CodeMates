package com.codemates.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.util.UUID;

@lombok.Getter
@lombok.Setter
@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "owner_user_id", nullable = false)
    private UUID ownerUserId;

    @jakarta.validation.constraints.Size(max = 150)
    @jakarta.validation.constraints.NotNull
    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "description", length = Integer.MAX_VALUE)
    private String description;

    @jakarta.validation.constraints.Size(max = 500)
    @Column(name = "github_repo_url", length = 500)
    private String githubRepoUrl;

    @jakarta.validation.constraints.Size(max = 20)
    @jakarta.validation.constraints.NotNull
    @ColumnDefault("'ACTIVE'")
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @jakarta.validation.constraints.Size(max = 20)
    @jakarta.validation.constraints.NotNull
    @ColumnDefault("'PRIVATE'")
    @Column(name = "visibility", nullable = false, length = 20)
    private String visibility;

    @jakarta.validation.constraints.Size(max = 500)
    @Column(name = "tech_stack", length = 500)
    private String techStack;

    @ColumnDefault("10")
    @Column(name = "max_members")
    private Integer maxMembers;


    @Column(name = "project_type")
    private String projectType;          // e.g. "Open Source", "Hackathon" — matches DiscoverProjectFilters' options

    @Column(name = "required_experience")
    private String requiredExperience;   // e.g. "Beginner", "Intermediate" — matches DiscoverProjectFilters' options

    @Column(name = "required_roles")
    private String requiredRoles;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("false")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("now()")
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (isDeleted == null) isDeleted = false;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

}