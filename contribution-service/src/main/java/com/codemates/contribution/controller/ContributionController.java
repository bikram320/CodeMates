package com.codemates.contribution.controller;

import com.codemates.contribution.dto.ApiResponse;
import com.codemates.contribution.dto.ContributionEventResponse;
import com.codemates.contribution.dto.ContributionScoreResponse;
import com.codemates.contribution.service.ContributionMlSyncService;
import com.codemates.contribution.service.ContributionScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contributions")
@RequiredArgsConstructor
public class ContributionController {

    private final ContributionScoreService contributionScoreService;
    private final ContributionMlSyncService contributionMlSyncService;

    @GetMapping("/projects/{projectId}/users/{userId}")
    public ApiResponse<ContributionScoreResponse> getScore(
            @PathVariable UUID projectId, @PathVariable UUID userId) {
        return ApiResponse.success("Contribution score fetched", contributionScoreService.getScore(userId, projectId));
    }

    @GetMapping("/projects/{projectId}/leaderboard")
    public ApiResponse<List<ContributionScoreResponse>> getLeaderboard(@PathVariable UUID projectId) {
        return ApiResponse.success("Leaderboard fetched", contributionScoreService.getLeaderboard(projectId));
    }

    @GetMapping("/projects/{projectId}/users/{userId}/events")
    public ApiResponse<List<ContributionEventResponse>> getEventHistory(
            @PathVariable UUID projectId, @PathVariable UUID userId) {
        return ApiResponse.success("Contribution history fetched", contributionScoreService.getEventHistory(userId, projectId));
    }

    // Triggers Model 3 significance predictions for every linked repo/member
    // in this project. Not called by the frontend in normal operation --
    // manual trigger for testing, or wire to a scheduled job later.
    @PostMapping("/projects/{projectId}/predict-significance")
    public ApiResponse<Void> predictSignificance(@PathVariable UUID projectId) {
        contributionMlSyncService.predictSignificanceForProject(projectId);
        return ApiResponse.success("Significance prediction triggered", null);
    }
}
