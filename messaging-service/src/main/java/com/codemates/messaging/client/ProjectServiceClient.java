package com.codemates.messaging.client;

import com.codemates.messaging.dto.ApiResponse;
import com.codemates.messaging.dto.MembershipCheckResponse;
import com.codemates.messaging.exception.ProjectServiceUnavailableException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.project.base-url}")
    private String projectServiceBaseUrl;

    /**
     * Calls GET /api/projects/{projectId}/members/{userId}/check on
     * project-service. Returns false if the user is simply not a member;
     * throws ProjectServiceUnavailableException if project-service could not
     * be reached at all (so the controller can distinguish 403 from 503).
     */
    public boolean isProjectMember(UUID projectId, UUID userId) {
        String url = UriComponentsBuilder.fromUriString(projectServiceBaseUrl)
                .path("/api/projects/{projectId}/members/{userId}/check")
                .buildAndExpand(projectId, userId)
                .toUriString();

        try {
            ResponseEntity<ApiResponse<MembershipCheckResponse>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    HttpEntity.EMPTY,
                    new ParameterizedTypeReference<ApiResponse<MembershipCheckResponse>>() {}
            );

            ApiResponse<MembershipCheckResponse> body = response.getBody();
            return body != null && body.getData() != null && body.getData().isMember();
        } catch (RestClientException e) {
            log.error("Could not reach project-service to check membership for project {} user {}", projectId, userId, e);
            throw new ProjectServiceUnavailableException("project-service unreachable", e);
        }
    }
}
