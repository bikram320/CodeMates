package com.codemates.contribution.controller;

import com.codemates.contribution.dto.ApiResponse;
import com.codemates.contribution.dto.ContributionEventResponse;
import com.codemates.contribution.dto.ContributionScoreResponse;
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
}
