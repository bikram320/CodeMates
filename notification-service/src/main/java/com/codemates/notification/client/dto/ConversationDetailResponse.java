package com.codemates.notification.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

/**
 * UNVERIFIED ASSUMPTION - see README. messaging-service's module notes list conversation
 * list/get/read/mute endpoints but the exact response shape for "get conversation" was not
 * provided. This assumes GET /api/conversations/{conversationId} returns a "participantUserIds"
 * list. If the real endpoint returns participants nested differently (e.g. a list of
 * ConversationParticipant objects with a userId field each, rather than a flat UUID list),
 * update this DTO and MessagingServiceClient.getOtherParticipants() accordingly.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class ConversationDetailResponse {
    private UUID id;
    private String type;
    private UUID projectId;
    private List<UUID> participantUserIds;
}
