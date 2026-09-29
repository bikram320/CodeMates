package com.codemates.project.client;

import com.codemates.project.dto.MlHealthDtos.BatchPredictRequestDto;
import com.codemates.project.dto.MlHealthDtos.BatchPredictResponseDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;

/**
 * Calls the FastAPI ml-service: POST /predict/health/batch
 * (the route in app.py is /predict/health/batch, NOT /predict/batch).
 * No blind retry: a 404/422 will not fix itself, and retries hid the real cause.
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
                .uri("/predict/health/batch")
                .bodyValue(request)
                .retrieve()
                .onStatus(HttpStatusCode::isError, resp -> resp.bodyToMono(String.class)
                        .defaultIfEmpty("")
                        .map(body -> new IllegalStateException(
                                "ml-service returned " + resp.statusCode() + ": " + body)))
                .bodyToMono(BatchPredictResponseDto.class)
                .timeout(Duration.ofSeconds(20))
                .doOnError(e -> log.error("ML service call failed: {}", e.getMessage()));
    }
}