package com.codemates.project.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Cached ML prediction for a project's GitHub repo health.
 * Populated by ProjectHealthService's scheduled job — never written
 * synchronously on a user-facing request.
 */
@Entity
@Table(name = "project_health" , schema = "project_schema")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectHealth {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(nullable = false, unique = true)
    private UUID projectId;

    @Column(nullable = false)
    private Double abandonProbability;

    @Column(nullable = false)
    private String healthStatus; // GREEN / YELLOW / RED

    @Column(nullable = false)
    private Integer isAbandonedPred; // 0 or 1, raw model output

    @Column(nullable = false)
    private Instant computedAt;

    // set true if the last scheduled sync failed for this project
    // (e.g. no linked GitHub repo, GitHub API error) -- lets the frontend
    // show "health unavailable" instead of a stale/misleading label
    @Builder.Default
    private Boolean stale = false;
}
