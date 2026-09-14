package com.codemates.notification.client;

import com.codemates.notification.client.dto.ConversationDetailResponse;
import com.codemates.notification.client.dto.RemoteApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessagingServiceClient {

    private final RestTemplate restTemplate;

    @Value("${services.messaging.base-url}")
    private String messagingServiceBaseUrl;

    /**
     * UNVERIFIED ENDPOINT - see ConversationDetailResponse javadoc and this module's README
     * entry. Assumes GET /api/conversations/{conversationId} exists and returns a flat
     * participantUserIds list. Returns an empty list on any failure so message.sent
     * notifications degrade to "nobody notified" rather than crashing the listener.
     */
    public List<UUID> getOtherParticipants(UUID conversationId, UUID excludeUserId) {
        String url = messagingServiceBaseUrl + "/api/conversations/" + conversationId;
        try {
            ResponseEntity<RemoteApiResponse<ConversationDetailResponse>> response = restTemplate.exchange(
                    url, HttpMethod.GET, null, new ParameterizedTypeReference<>() {});
            RemoteApiResponse<ConversationDetailResponse> body = response.getBody();
            if (body == null || body.getData() == null || body.getData().getParticipantUserIds() == null) {
                return List.of();
            }
            return body.getData().getParticipantUserIds().stream()
                    .filter(id -> !id.equals(excludeUserId))
                    .collect(Collectors.toList());
        } catch (RestClientException e) {
            log.warn("Failed to fetch conversation {} from messaging-service: {}", conversationId, e.getMessage());
            return List.of();
        }
    }
}
