package com.codemates.contribution.client;

import com.codemates.contribution.dto.MlContributionBatchRequest;
import com.codemates.contribution.dto.MlContributionBatchResponse;
import com.codemates.contribution.exception.UpstreamServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Calls the shared FastAPI ml-service directly (not wrapped in
 * ApiResponse<T> the way Spring services are -- ml-service returns raw
 * JSON per its own Pydantic response models).
 */
@Slf4j
@Component
public class MlServiceClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public MlServiceClient(RestTemplate restTemplate,
                            @Value("${services.ml-service.base-url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public MlContributionBatchResponse predictBatch(MlContributionBatchRequest request) {
        String url = baseUrl + "/predict/contribution/batch";
        try {
            ResponseEntity<MlContributionBatchResponse> response = restTemplate.exchange(
                    url, HttpMethod.POST, new HttpEntity<>(request), MlContributionBatchResponse.class);

            MlContributionBatchResponse body = response.getBody();
            if (body == null) {
                throw new UpstreamServiceException("Empty response from ml-service /predict/contribution/batch", null);
            }
            return body;
        } catch (Exception e) {
            log.error("Failed to call ml-service /predict/contribution/batch", e);
            throw new UpstreamServiceException("Failed to call ml-service for contribution predictions", e);
        }
    }
}
