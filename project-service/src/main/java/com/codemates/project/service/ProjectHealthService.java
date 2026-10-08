package com.codemates.project.service;

import com.codemates.project.client.GithubSyncClient;
import com.codemates.project.client.MlHealthClient;
import com.codemates.project.dto.GithubStatsDto;
import com.codemates.project.dto.MlHealthDtos.*;
import com.codemates.project.model.Project;
import com.codemates.project.model.ProjectHealth;
import com.codemates.project.repository.ProjectHealthRepository;
import com.codemates.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectHealthService {

    private final ProjectRepository projectRepository;
    private final ProjectHealthRepository projectHealthRepository;
    private final MlHealthClient mlHealthClient;
    private final GithubSyncClient githubSyncClient;

    /**
     * No scheduler: the server isn't up 24/7, so health is refreshed on demand
     * by ProjectHealthController (when the cached row is missing/stale/old).
     */

    /**
     * On-demand refresh for ONE project. Called by ProjectHealthController
     * when the cached row is missing or old, so the ML service actually gets
     * hit without waiting for the 3 AM job.
     */
    @Transactional
    public void syncProjectHealth(UUID projectId) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) {
            log.warn("Health sync: project {} not found", projectId);
            return;
        }
        if (project.getGithubRepoUrl() == null || project.getGithubRepoUrl().isBlank()) {
            log.info("Health sync: project {} has no githubRepoUrl -- skipping", projectId);
            return;
        }

        RepoFeaturesDto features = fetchRepoFeaturesOrNull(project);
        if (features == null) {
            log.warn("Health sync: no synced GitHub data for project {} ({}) -- skipping ML call",
                    projectId, project.getGithubRepoUrl());
            return;
        }

        log.info("Health sync: calling ml-service for project {}", projectId);
        BatchPredictResponseDto response = mlHealthClient
                .predictBatch(BatchPredictRequestDto.builder().repos(List.of(features)).build())
                .block();

        if (response == null || response.getResults() == null || response.getResults().isEmpty()) {
            log.error("Health sync: ML service returned no results for project {}", projectId);
            return;
        }

        for (PredictionResultDto result : response.getResults()) {
            saveOrUpdate(UUID.fromString(result.getProjectId()), result);
        }
        log.info("Health sync: project {} updated", projectId);
    }

    @Transactional
    public void syncAllProjectsHealth() {
        List<Project> activeProjects = projectRepository.findByStatusAndIsDeletedFalse("ACTIVE");
        List<Project> withRepo = activeProjects.stream()
                .filter(p -> p.getGithubRepoUrl() != null && !p.getGithubRepoUrl().isBlank())
                .collect(Collectors.toList());

        if (withRepo.isEmpty()) {
            log.info("No active projects with a linked GitHub repo -- nothing to sync");
            return;
        }

        List<RepoFeaturesDto> features = withRepo.stream()
                .map(this::fetchRepoFeaturesOrNull)
                .filter(f -> f != null)
                .collect(Collectors.toList());

        if (features.isEmpty()) {
            log.warn("No repo features available for any project this run");
            return;
        }

        BatchPredictResponseDto response = mlHealthClient
                .predictBatch(BatchPredictRequestDto.builder().repos(features).build())
                .block();

        if (response == null || response.getResults() == null) {
            log.error("ML service returned no results for health sync");
            return;
        }

        for (PredictionResultDto result : response.getResults()) {
            saveOrUpdate(UUID.fromString(result.getProjectId()), result);
        }
        log.info("Project health sync complete: {} projects updated", response.getResults().size());
    }

    private void saveOrUpdate(UUID projectId, PredictionResultDto result) {
        ProjectHealth health = projectHealthRepository.findByProjectId(projectId)
                .orElse(ProjectHealth.builder().projectId(projectId).build());

        health.setAbandonProbability(result.getAbandonProbability());
        health.setHealthStatus(result.getHealthStatus());
        health.setIsAbandonedPred(result.getIsAbandonedPred());
        health.setComputedAt(Instant.now());
        health.setStale(false);

        projectHealthRepository.save(health);
    }

    private RepoFeaturesDto fetchRepoFeaturesOrNull(Project project) {
        String repoFullName = extractRepoFullName(project.getGithubRepoUrl());
        if (repoFullName == null) {
            log.warn("Could not parse repoFullName from githubRepoUrl for project {}", project.getId());
            return null;
        }

        GithubStatsDto.Wrapped response = githubSyncClient.fetchRepoStats(repoFullName);
        if (response == null || response.getData() == null) {
            return null; // not synced yet, or a lookup error -- skip this project this run
        }

        GithubStatsDto.RepoStats stats = response.getData();
        return RepoFeaturesDto.builder()
                .projectId(project.getId().toString())
                .stars(stats.getStars())
                .forks(stats.getForks())
                .openIssues(stats.getOpenIssues())
                .contributors(stats.getContributors())
                .sizeKb(stats.getSizeKb() != null ? stats.getSizeKb().doubleValue() : 0.0)
                .projectAgeDays(stats.getProjectAgeDays())
                .language(stats.getLanguage())
                .license(stats.getLicense())
                .build();
    }

    private String extractRepoFullName(String githubRepoUrl) {
        if (githubRepoUrl == null || githubRepoUrl.isBlank()) return null;

        String cleaned = githubRepoUrl.trim();
        if (cleaned.contains("github.com/")) {
            cleaned = cleaned.substring(cleaned.indexOf("github.com/") + "github.com/".length());
        }
        cleaned = cleaned.replaceAll("/+$", "");
        cleaned = cleaned.replaceAll("\\.git$", "");

        String[] parts = cleaned.split("/");
        if (parts.length < 2) return null;
        return parts[0] + "/" + parts[1];
    }
}