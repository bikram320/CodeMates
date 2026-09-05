package com.codemates.project.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.time.Instant;
import java.util.UUID;

@lombok.Getter
@lombok.Setter
@Entity
@Table(name = "project_members")
public class ProjectMember {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @jakarta.validation.constraints.Size(max = 20)
    @jakarta.validation.constraints.NotNull
    @ColumnDefault("'CONTRIBUTOR'")
    @Column(name = "role", nullable = false, length = 20)
    private String role;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("now()")
    @Column(name = "joined_at", nullable = false)
    private Instant joinedAt;

    @Column(name = "invited_by_user_id")
    private UUID invitedByUserId;

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

}