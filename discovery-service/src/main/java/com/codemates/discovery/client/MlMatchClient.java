package com.codemates.discovery.client;

import com.codemates.discovery.dto.MlMatchDtos.MatchBatchPredictRequestDto;
import com.codemates.discovery.dto.MlMatchDtos.MatchBatchPredictResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;

/**
 * Talks to the shared ml-service (same service Model 2 uses, different route).
 * Used only by MatchSyncService's scheduled job -- never called synchronously
 * from a user-facing controller.
 */
@Slf4j
@Component
public class MlMatchClient {

    private final WebClient webClient;

    public MlMatchClient(@Value("${ml-service.base-url}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public Mono<MatchBatchPredictResponseDto> predictBatch(MatchBatchPredictRequestDto request) {
        return webClient.post()
                .uri("/predict/match/batch")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(MatchBatchPredictResponseDto.class)
                .timeout(Duration.ofSeconds(15))
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(1)))
                .doOnError(e -> log.error("ML service match call failed: {}", e.getMessage()));
    }
}
