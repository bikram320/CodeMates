package com.codemates.contribution.client;

import com.codemates.contribution.dto.ApiResponse;
import com.codemates.contribution.dto.ProjectTaskDto;
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
 * ASSUMPTION FLAGGED: endpoint confirmed as
 * GET /api/projects/{projectId}/tasks/{taskId} -> ApiResponse<TaskResponse>
 * per project-service's TaskController.
 */
@Slf4j
@Component
public class ProjectServiceClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;

    public ProjectServiceClient(RestTemplate restTemplate,
                                 @Value("${services.project-service.base-url}") String baseUrl) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
    }

    public ProjectTaskDto getTask(UUID projectId, UUID taskId) {
        String url = UriComponentsBuilder.fromUriString(baseUrl)
                .path("/api/projects/{projectId}/tasks/{taskId}")
                .buildAndExpand(projectId, taskId)
                .toUriString();

        try {
            ResponseEntity<ApiResponse<ProjectTaskDto>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});

            ApiResponse<ProjectTaskDto> body = response.getBody();
            if (body == null || body.getData() == null) {
                throw new UpstreamServiceException("Empty response fetching task " + taskId + " from project-service", null);
            }
            return body.getData();
        } catch (Exception e) {
            log.error("Failed to fetch task {} from project-service", taskId, e);
            throw new UpstreamServiceException("Failed to fetch task " + taskId + " from project-service", e);
        }
    }
}
