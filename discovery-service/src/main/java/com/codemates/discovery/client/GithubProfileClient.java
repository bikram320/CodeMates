package com.codemates.discovery.client;

import com.codemates.discovery.dto.GithubSkillProfileDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.UUID;

/**
 * Calls github-sync-service's GET /api/github/profiles/{userId}/skill-profile
 * (wraps ApiResponse<T> -- unwrap .getData()).
 */
@Slf4j
@Component
public class GithubProfileClient {

    private final WebClient webClient;

    public GithubProfileClient(@Value("${github-sync-service.base-url}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public GithubSkillProfileDto.Data fetchSkillProfile(UUID userId) {
        try {
            GithubSkillProfileDto.Wrapped response = webClient.get()
                    .uri("/api/github/profiles/{userId}/skill-profile", userId)
                    .retrieve()
                    .bodyToMono(GithubSkillProfileDto.Wrapped.class)
                    .timeout(Duration.ofSeconds(5))
                    .block();
            return response != null ? response.getData() : null;
        } catch (WebClientResponseException.NotFound e) {
            log.info("No GitHub skill profile yet for user: {}", userId);
            return null;
        } catch (Exception e) {
            log.warn("Failed to fetch skill profile for {}: {}", userId, e.getMessage());
            return null;
        }
    }
}
