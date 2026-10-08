package com.codemates.contribution.controller;

import com.codemates.contribution.dto.ApiResponse;
import com.codemates.contribution.dto.LinkRepositoryRequest;
import com.codemates.contribution.dto.RepositoryLinkResponse;
import com.codemates.contribution.security.JwtCookieExtractor;
import com.codemates.contribution.service.ContributionScoreService;
import com.codemates.contribution.service.RepositoryLinkService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/contributions/projects/{projectId}/repository-links")
@RequiredArgsConstructor
public class RepositoryLinkController {

    private final RepositoryLinkService repositoryLinkService;
    private final JwtCookieExtractor jwtCookieExtractor;
    private final ContributionScoreService contributionScoreService;

    @PostMapping
    public ResponseEntity<ApiResponse<RepositoryLinkResponse>> link(
            HttpServletRequest request, @PathVariable UUID projectId,
            @Valid @RequestBody LinkRepositoryRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        RepositoryLinkResponse saved = repositoryLinkService.linkRepository(userId, projectId, dto.getRepositoryId());
        try {
            contributionScoreService.syncCommitsForLink(saved.getId());
        } catch (Exception e) {
            // never fail the link because of a backfill problem
            org.slf4j.LoggerFactory.getLogger(getClass()).warn("Commit backfill after link failed", e);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success("Repository linked", saved));
    }

    @DeleteMapping("/{repositoryId}")
    public ApiResponse<Void> unlink(@PathVariable UUID projectId, @PathVariable UUID repositoryId) {
        repositoryLinkService.unlinkRepository(projectId, repositoryId);
        return ApiResponse.success("Repository unlinked", null);
    }

    @GetMapping
    public ApiResponse<List<RepositoryLinkResponse>> list(@PathVariable UUID projectId) {
        return ApiResponse.success("Repository links fetched", repositoryLinkService.getLinksForProject(projectId));
    }
}
