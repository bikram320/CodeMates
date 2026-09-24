package com.codemates.project.client;

import com.codemates.project.dto.MlHealthDtos.BatchPredictRequestDto;
import com.codemates.project.dto.MlHealthDtos.BatchPredictResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;
import reactor.util.retry.Retry;

import java.time.Duration;

/**
 * Talks to the standalone FastAPI ML service (see /ml-service in the repo).
 * Used ONLY by the scheduled ProjectHealthService job -- never called
 * synchronously from a user-facing controller.
 */
@Slf4j
@Component
public class MlHealthClient {

    private final WebClient webClient;

    public MlHealthClient(@Value("${ml-service.base-url}") String baseUrl) {
        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .build();
    }

    public Mono<BatchPredictResponseDto> predictBatch(BatchPredictRequestDto request) {
        return webClient.post()
                .uri("/predict/batch")
                .bodyValue(request)
                .retrieve()
                .bodyToMono(BatchPredictResponseDto.class)
                .timeout(Duration.ofSeconds(10))
                .retryWhen(Retry.backoff(2, Duration.ofSeconds(1)))
                .doOnError(e -> log.error("ML service call failed: {}", e.getMessage()));
    }
}
