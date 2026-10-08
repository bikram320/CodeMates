package com.codemates.project.client;

import com.codemates.project.dto.GithubStatsDto.Wrapped;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Calls github-sync-service's internal lookup endpoint. Used only by
 * ProjectHealthService's scheduled job, never on a user-facing request path.
 */
@Slf4j
@Component
public class GithubSyncClient {

    private final WebClient webClient;

    public GithubSyncClient(@Value("${github-sync-service.base-url}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    /**
     * Returns null (not an error) if the repo has never been synced yet --
     * that project is simply skipped this run, same pattern as everywhere
     * else in ProjectHealthService.
     */
    public Wrapped fetchRepoStats(String repoFullName) {
        try {
            return webClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/api/github/repositories/lookup")
                            .queryParam("repoFullName", repoFullName)
                            .build())
                    .retrieve()
                    .bodyToMono(Wrapped.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
        } catch (WebClientResponseException.NotFound e) {
            log.info("No synced GitHub data yet for repo: {}", repoFullName);
            return null;
        } catch (Exception e) {
            log.warn("Failed to fetch GitHub stats for {}: {}", repoFullName, e.getMessage());
            return null;
        }
    }
}