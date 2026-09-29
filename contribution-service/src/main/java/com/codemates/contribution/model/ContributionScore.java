package com.codemates.contribution.model;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@lombok.Getter
@lombok.Setter
@Entity
@Table(name = "contribution_scores")
public class ContributionScore {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "project_id", nullable = false)
    private UUID projectId;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("0")
    @Column(name = "tasks_completed", nullable = false)
    private Integer tasksCompleted;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("0")
    @Column(name = "tasks_reviewed", nullable = false)
    private Integer tasksReviewed;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("0")
    @Column(name = "messages_sent", nullable = false)
    private Integer messagesSent;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("0")
    @Column(name = "commits_count", nullable = false)
    private Integer commitsCount;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("0")
    @Column(name = "files_shared", nullable = false)
    private Integer filesShared;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("0.00")
    @Column(name = "total_score", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalScore;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("now()")
    @Column(name = "last_calculated_at", nullable = false)
    private Instant lastCalculatedAt;

    private Double significanceProbability;   // Model 3's predicted probability (0-1), separate from totalScore
    private Instant significancePredictedAt;

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
