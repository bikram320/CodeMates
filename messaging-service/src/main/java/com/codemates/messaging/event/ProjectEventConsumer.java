package com.codemates.messaging.event;

import com.codemates.messaging.service.ConversationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.util.UUID;

/**
 * Listens to project-service's events to keep PROJECT-type conversations in
 * sync with actual project membership.
 *
 * NOTE on Jackson: project-service's ProjectEventProducer (as shared) imports
 * tools.jackson.databind.ObjectMapper (Jackson 3.x), while your documented
 * gotcha says this stack uses classic com.fasterxml.jackson. That only
 * affects which Java API each service's own code uses — both produce
 * standard JSON on the wire, so this classic-Jackson consumer can still
 * read it fine. Worth confirming with the project-service author whether
 * the tools.jackson import there was intentional, since it diverges from
 * the rest of the stack.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectEventConsumer {

    private final ConversationService conversationService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "project.created", groupId = "messaging-service")
    public void onProjectCreated(byte[] payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            UUID projectId = UUID.fromString(node.get("projectId").asText());
            UUID ownerUserId = UUID.fromString(node.get("ownerUserId").asText());
            conversationService.ensureProjectConversation(projectId, ownerUserId);
        } catch (Exception e) {
            log.error("Failed to process project.created event", e);
        }
    }

    @KafkaListener(topics = "project.member.joined", groupId = "messaging-service")
    public void onMemberJoined(byte[] payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            UUID projectId = UUID.fromString(node.get("projectId").asText());
            UUID userId = UUID.fromString(node.get("userId").asText());
            conversationService.addProjectMemberToConversation(projectId, userId);
        } catch (Exception e) {
            log.error("Failed to process project.member.joined event", e);
        }
    }

    @KafkaListener(topics = "project.member.removed", groupId = "messaging-service")
    public void onMemberRemoved(byte[] payload) {
        try {
            JsonNode node = objectMapper.readTree(payload);
            UUID projectId = UUID.fromString(node.get("projectId").asText());
            UUID userId = UUID.fromString(node.get("userId").asText());
            conversationService.removeProjectMemberFromConversation(projectId, userId);
        } catch (Exception e) {
            log.error("Failed to process project.member.removed event", e);
        }
    }
}
