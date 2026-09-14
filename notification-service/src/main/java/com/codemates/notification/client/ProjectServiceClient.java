package com.codemates.notification.client;

import com.codemates.notification.client.dto.RemoteApiResponse;
import com.codemates.notification.client.dto.TaskDetailResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.project.base-url}")
    private String projectServiceBaseUrl;

    /**
     * Confirmed endpoint per project-service module notes: GET /api/projects/{projectId}/tasks/{taskId}.
     * The response FIELD NAMES on TaskDetailResponse are an unverified assumption - see that
     * class's javadoc. Returns empty on any failure (network, 404, unexpected shape) rather
     * than throwing, so a lookup failure degrades to "notification skipped", not a Kafka
     * listener crash/retry loop.
     */
    public Optional<TaskDetailResponse> getTask(UUID projectId, UUID taskId) {
        String url = projectServiceBaseUrl + "/api/projects/" + projectId + "/tasks/" + taskId;
        try {
            ResponseEntity<RemoteApiResponse<TaskDetailResponse>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            RemoteApiResponse<TaskDetailResponse> body = response.getBody();
            if (body == null || body.getData() == null) {
                return Optional.empty();
            }
            return Optional.of(body.getData());
        } catch (RestClientException e) {
            log.warn("Failed to fetch task {} for project {} from project-service: {}", taskId, projectId, e.getMessage());
            return Optional.empty();
        }
    }
}
