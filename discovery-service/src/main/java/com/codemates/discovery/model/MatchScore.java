package com.codemates.discovery.model;

import jakarta.persistence.*;
import org.hibernate.annotations.ColumnDefault;
import org.springframework.cglib.core.Local;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

@lombok.Getter
@lombok.Setter
@Entity
@Table(name = "match_scores")
public class MatchScore {
    @Id
    @ColumnDefault("gen_random_uuid()")
    @Column(name = "id", nullable = false)
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @jakarta.validation.constraints.NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @jakarta.validation.constraints.NotNull
    @Column(name = "matched_user_id", nullable = false)
    private UUID matchedUserId;

    @ColumnDefault("0.00")
    @Column(name = "skill_score", precision = 5, scale = 2)
    private BigDecimal skillScore;

    @ColumnDefault("0.00")
    @Column(name = "experience_score", precision = 5, scale = 2)
    private BigDecimal experienceScore;

    @ColumnDefault("0.00")
    @Column(name = "activity_score", precision = 5, scale = 2)
    private BigDecimal activityScore;

    @ColumnDefault("0.00")
    @Column(name = "interest_score", precision = 5, scale = 2)
    private BigDecimal interestScore;

    @ColumnDefault("0.00")
    @Column(name = "total_match_score", precision = 5, scale = 2)
    private BigDecimal totalMatchScore;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("now()")
    @Column(name = "last_calculated_at", nullable = false)
    private LocalDateTime lastCalculatedAt;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("false")
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @jakarta.validation.constraints.NotNull
    @ColumnDefault("now()")
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @jakarta.validation.constraints.NotNull
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