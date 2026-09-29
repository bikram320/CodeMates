package com.codemates.contribution.controller;

import com.codemates.contribution.dto.ApiResponse;
import com.codemates.contribution.dto.ContributionEventResponse;
import com.codemates.contribution.dto.ContributionScoreResponse;
import com.codemates.contribution.service.ContributionMlSyncService;
import com.codemates.contribution.service.ContributionScoreService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@RestController
@RequestMapping("/api/contributions")
@RequiredArgsConstructor
public class ContributionController {

    private static final Duration MAX_AGE = Duration.ofHours(6);
    private static final Duration RETRY_COOLDOWN = Duration.ofSeconds(60);

    private final ContributionScoreService contributionScoreService;
    private final ContributionMlSyncService contributionMlSyncService;

    // Prevents hammering ml-service / github-sync if a refresh keeps failing.
    private final Map<UUID, Instant> lastAttempt = new ConcurrentHashMap<>();

    @GetMapping("/projects/{projectId}/users/{userId}")
    public ApiResponse<ContributionScoreResponse> getScore(
            @PathVariable UUID projectId, @PathVariable UUID userId) {
        return ApiResponse.success("Contribution score fetched", contributionScoreService.getScore(userId, projectId));
    }

    @GetMapping("/projects/{projectId}/leaderboard")
    public ApiResponse<List<ContributionScoreResponse>> getLeaderboard(@PathVariable UUID projectId) {
        List<ContributionScoreResponse> board = contributionScoreService.getLeaderboard(projectId);

        if (needsRefresh(board) && cooldownPassed(projectId)) {
            try {
                log.info("Refreshing significance predictions for project {}", projectId);
                contributionMlSyncService.predictSignificanceForProject(projectId);
                board = contributionScoreService.getLeaderboard(projectId);
            } catch (Exception e) {
                log.warn("Significance refresh failed for project {}", projectId, e);
            }
        }
        return ApiResponse.success("Leaderboard fetched", board);
    }

    @GetMapping("/projects/{projectId}/users/{userId}/events")
    public ApiResponse<List<ContributionEventResponse>> getEventHistory(
            @PathVariable UUID projectId, @PathVariable UUID userId) {
        return ApiResponse.success("Contribution history fetched", contributionScoreService.getEventHistory(userId, projectId));
    }

    // Manual trigger for testing: POST /api/contributions/projects/{projectId}/predict-significance
    @PostMapping("/projects/{projectId}/predict-significance")
    public ApiResponse<Void> predictSignificance(@PathVariable UUID projectId) {
        contributionMlSyncService.predictSignificanceForProject(projectId);
        return ApiResponse.success("Significance prediction triggered", null);
    }

    private boolean needsRefresh(List<ContributionScoreResponse> board) {
        if (board.isEmpty()) return true; // links may exist with no score rows yet
        Instant cutoff = Instant.now().minus(MAX_AGE);
        return board.stream().anyMatch(s ->
                s.getSignificancePredictedAt() == null || s.getSignificancePredictedAt().isBefore(cutoff));
    }

    private boolean cooldownPassed(UUID projectId) {
        Instant now = Instant.now();
        Instant prev = lastAttempt.get(projectId);
        if (prev != null && prev.plus(RETRY_COOLDOWN).isAfter(now)) return false;
        lastAttempt.put(projectId, now);
        return true;
    }
}