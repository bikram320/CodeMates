package com.codemates.contribution.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@lombok.Getter
@lombok.Setter
@Entity
@Table(name = "contribution_events")
public class ContributionEvent {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @jakarta.validation.constraints.Size(max = 50)
    @jakarta.validation.constraints.NotNull
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("0.00")
    @Column(name = "points_awarded", nullable = false, precision = 10, scale = 2)
    private BigDecimal pointsAwarded;

    @Column(name = "reference_id")
    private UUID referenceId;

    @jakarta.validation.constraints.Size(max = 50)
    @Column(name = "reference_type", length = 50)
    private String referenceType;

    @jakarta.validation.constraints.Size(max = 255)
    @Column(name = "description")
    private String description;

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
