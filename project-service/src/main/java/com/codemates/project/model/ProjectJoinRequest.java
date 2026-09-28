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

/**
 * Member-initiated request to join a PUBLIC project. Deliberately a
 * separate entity from ProjectInvitation (leader-initiated) rather than
 * a shared table with a "direction" column — the two have different
 * actors, different validity rules (invitations expire, requests don't;
 * requests are only ever for PUBLIC projects), and keeping them separate
 * means each can evolve without a discriminator column creeping in.
 */
@lombok.Getter
@lombok.Setter
@Entity
@Table(name = "project_join_requests")
public class ProjectJoinRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "requesting_user_id", nullable = false)
    private UUID requestingUserId;

    @jakarta.validation.constraints.Size(max = 20)
    @jakarta.validation.constraints.NotNull
    @ColumnDefault("'PENDING'")
    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "responded_at")
    private Instant respondedAt;

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