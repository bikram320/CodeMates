package com.codemates.project.controller;

import com.codemates.project.dto.ApiResponse;
import com.codemates.project.dto.MlHealthDtos.ProjectHealthResponse;
import com.codemates.project.model.ProjectHealth;
import com.codemates.project.repository.ProjectHealthRepository;
import com.codemates.project.service.ProjectHealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/health")
@RequiredArgsConstructor
public class ProjectHealthController {

    private final ProjectHealthRepository projectHealthRepository;
    private final ProjectHealthService projectHealthService;

    // Fast -- reads a cached row, never calls the ML service.
    @GetMapping
    public ApiResponse<ProjectHealthResponse> getHealth(@PathVariable UUID projectId) {
        ProjectHealth health = projectHealthRepository.findByProjectId(projectId).orElse(null);

        if (health == null) {
            // no prediction computed yet (new project, no linked repo, or
            // hasn't hit a scheduled sync cycle yet) -- not an error
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

    // Manual trigger for testing/demo -- NOT called by the frontend in
    // normal operation. Useful so you don't have to wait for 3 AM during
    // development, or for a "refresh now" admin action later.
    @PostMapping("/sync")
    public ApiResponse<Void> triggerSync(@PathVariable UUID projectId) {
        projectHealthService.syncAllProjectsHealth(); // currently syncs all; fine for now given low project counts
        return ApiResponse.success("Health sync triggered", null);
    }
}
