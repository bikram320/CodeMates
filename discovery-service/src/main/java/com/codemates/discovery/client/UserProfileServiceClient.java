package com.codemates.discovery.client;

import com.codemates.discovery.dto.ProfileSearchResult;
import com.codemates.discovery.exception.ExternalServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class UserProfileServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.user-profile.base-url}")
    private String userProfileBaseUrl;

    public UserProfileServiceClient(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public List<ProfileSearchResult> searchProfiles(List<String> skills,
                                                      String experienceLevel,
                                                      List<String> interests,
                                                      Boolean openToCollaborate) {

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(userProfileBaseUrl + "/api/users/search");

        if (skills != null && !skills.isEmpty()) {
            builder.queryParam("skills", String.join(",", skills));
        }
        if (experienceLevel != null && !experienceLevel.isBlank()) {
            builder.queryParam("experienceLevel", experienceLevel);
        }
        if (interests != null && !interests.isEmpty()) {
            builder.queryParam("interests", String.join(",", interests));
        }
        if (openToCollaborate != null) {
            builder.queryParam("openToCollaborate", openToCollaborate);
        }

        try {
            ResponseEntity<ExternalApiResponse<List<ProfileSearchResult>>> response = restTemplate.exchange(
                    builder.toUriString(),
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {}
            );

            ExternalApiResponse<List<ProfileSearchResult>> body = response.getBody();
            if (body == null || body.getData() == null) {
                return Collections.emptyList();
            }
            return body.getData();

        } catch (RestClientException e) {
            log.error("Failed to reach user-profile-service for search", e);
            throw new ExternalServiceException("Could not reach user-profile-service", e);
        }
    }
}
