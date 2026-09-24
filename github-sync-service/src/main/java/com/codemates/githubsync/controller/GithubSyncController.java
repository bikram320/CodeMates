package com.codemates.githubsync.controller;

import com.codemates.githubsync.dto.*;
import com.codemates.githubsync.security.JwtCookieExtractor;
import com.codemates.githubsync.service.GithubSyncService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
public class GithubSyncController {

    private final GithubSyncService githubSyncService;
    private final JwtCookieExtractor jwtCookieExtractor;

    @PostMapping("/connect")
    public ApiResponse<GithubProfileResponseDto> connect(
            HttpServletRequest request,
            @Valid @RequestBody GithubConnectRequestDto dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("GitHub account connected", githubSyncService.connect(userId, dto.getAccessToken()));
    }

    @PostMapping("/sync")
    public ApiResponse<SyncResultDto> sync(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Sync triggered", githubSyncService.syncUser(userId));
    }

    @GetMapping("/profile")
    public ApiResponse<GithubProfileResponseDto> getProfile(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Profile fetched", githubSyncService.getProfile(userId));
    }

    @GetMapping("/repositories")
    public ApiResponse<List<RepositoryResponseDto>> getRepositories(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Repositories fetched", githubSyncService.getRepositories(userId));
    }

    @GetMapping("/repositories/{repositoryId}/commit-stats")
    public ApiResponse<CommitStatResponseDto> getCommitStats(@PathVariable UUID repositoryId) {
        return ApiResponse.success("Commit stats fetched", githubSyncService.getCommitStats(repositoryId));
    }

    // Internal endpoint -- called by project-service's health-sync job, not the frontend
    @GetMapping("/repositories/lookup")
    public ApiResponse<RepoHealthStatsDto> lookupRepoStats(@RequestParam String repoFullName) {
        return ApiResponse.success("Repo stats fetched", githubSyncService.getRepoStatsForHealth(repoFullName));
    }
}