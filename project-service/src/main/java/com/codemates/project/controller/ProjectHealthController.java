package com.codemates.project.controller;

import com.codemates.project.dto.ApiResponse;
import com.codemates.project.dto.MlHealthDtos.ProjectHealthResponse;
import com.codemates.project.model.ProjectHealth;
import com.codemates.project.repository.ProjectHealthRepository;
import com.codemates.project.service.ProjectHealthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/projects/{projectId}/health")
@RequiredArgsConstructor
public class ProjectHealthController {

    private static final Duration MAX_AGE = Duration.ofHours(6);

    private final ProjectHealthRepository projectHealthRepository;
    private final ProjectHealthService projectHealthService;

    // Reads the cached row. If it's missing, flagged stale, or older than
    // MAX_AGE, refresh it first (this is what actually calls the ML service).
    // A failed refresh never breaks the endpoint -- we fall back to the cache.
    @GetMapping
    public ApiResponse<ProjectHealthResponse> getHealth(@PathVariable UUID projectId) {
        ProjectHealth health = projectHealthRepository.findByProjectId(projectId).orElse(null);

        if (needsRefresh(health)) {
            try {
                projectHealthService.syncProjectHealth(projectId);
                health = projectHealthRepository.findByProjectId(projectId).orElse(health);
            } catch (Exception e) {
                log.warn("On-demand health refresh failed for project {}: {}", projectId, e.getMessage());
            }
        }

        if (health == null) {
            return ApiResponse.success("Health not yet computed for this project", null);
        }

        ProjectHealthResponse response = ProjectHealthResponse.builder()
                .projectId(health.getProjectId())
                .healthStatus(health.getHealthStatus())
                .abandonProbability(health.getAbandonProbability())
                .computedAt(health.getComputedAt())
                .stale(health.getStale())
                .build();

        return ApiResponse.success("Health fetched", response);
    }

    // Manual trigger for testing: POST /api/projects/{projectId}/health/sync
    @PostMapping("/sync")
    public ApiResponse<Void> triggerSync(@PathVariable UUID projectId) {
        projectHealthService.syncProjectHealth(projectId);
        return ApiResponse.success("Health sync triggered", null);
    }

    private boolean needsRefresh(ProjectHealth health) {
        if (health == null) return true;
        if (Boolean.TRUE.equals(health.getStale())) return true;
        if (health.getComputedAt() == null) return true;
        return health.getComputedAt().isBefore(Instant.now().minus(MAX_AGE));
    }
}