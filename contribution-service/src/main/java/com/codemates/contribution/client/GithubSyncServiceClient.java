package com.codemates.contribution.client;

import com.codemates.contribution.dto.ApiResponse;
import com.codemates.contribution.dto.DeveloperSkillProfileDto;
import com.codemates.contribution.dto.GithubCommitStatDto;
import com.codemates.contribution.dto.RepoContextDto;
import com.codemates.contribution.exception.UpstreamServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.UUID;

/**
 * ASSUMPTION FLAGGED (unverified — I do not have github-sync-service's
 * controller, only GithubSyncService.getCommitStats(repositoryId)):
 * guessing GET /api/github/repositories/{repositoryId}/commit-stats
 * -> ApiResponse<CommitStatResponseDto>.
 * Confirm/correct the path in application.properties or here before
 * relying on the github sync consumer.
 *
 * getSkillProfile() and getRepoContext() below call endpoints that ARE
 * confirmed (built for Models 1 and 2 in this same conversation):
 *   GET /api/github/profiles/{userId}/skill-profile
 *   GET /api/github/repositories/{repositoryId}/context
 */
@Slf4j
@Component
public class GithubSyncServiceClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public GithubSyncServiceClient(RestTemplate restTemplate,
                                    @Value("${services.github-sync-service.base-url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public GithubCommitStatDto getCommitStats(UUID repositoryId) {
        String url = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/api/github/repositories/{repositoryId}/commit-stats")
                .buildAndExpand(repositoryId)
                .toUriString();

        try {
            ResponseEntity<ApiResponse<GithubCommitStatDto>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});

            ApiResponse<GithubCommitStatDto> body = response.getBody();
            if (body == null || body.getData() == null) {
                throw new UpstreamServiceException("Empty response fetching commit stats for repo " + repositoryId, null);
            }
            return body.getData();
        } catch (Exception e) {
            log.error("Failed to fetch commit stats for repo {} from github-sync-service", repositoryId, e);
            throw new UpstreamServiceException("Failed to fetch commit stats for repo " + repositoryId, e);
        }
    }

    public DeveloperSkillProfileDto getSkillProfile(UUID userId) {
        String url = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/api/github/profiles/{userId}/skill-profile")
                .buildAndExpand(userId)
                .toUriString();

        try {
            ResponseEntity<ApiResponse<DeveloperSkillProfileDto>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});

            ApiResponse<DeveloperSkillProfileDto> body = response.getBody();
            if (body == null || body.getData() == null) {
                throw new UpstreamServiceException("Empty response fetching skill profile for user " + userId, null);
            }
            return body.getData();
        } catch (Exception e) {
            log.error("Failed to fetch skill profile for user {} from github-sync-service", userId, e);
            throw new UpstreamServiceException("Failed to fetch skill profile for user " + userId, e);
        }
    }

    public RepoContextDto getRepoContext(UUID repositoryId) {
        String url = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/api/github/repositories/{repositoryId}/context")
                .buildAndExpand(repositoryId)
                .toUriString();

        try {
            ResponseEntity<ApiResponse<RepoContextDto>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});

            ApiResponse<RepoContextDto> body = response.getBody();
            if (body == null || body.getData() == null) {
                throw new UpstreamServiceException("Empty response fetching repo context for repository " + repositoryId, null);
            }
            return body.getData();
        } catch (Exception e) {
            log.error("Failed to fetch repo context for repository {} from github-sync-service", repositoryId, e);
            throw new UpstreamServiceException("Failed to fetch repo context for repository " + repositoryId, e);
        }
    }
}
