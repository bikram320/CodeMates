package com.codemates.project.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectEventProducer {

    private final KafkaTemplate<String, byte[]> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishProjectCreated(UUID projectId, UUID ownerUserId) {
        publish("project.created", projectId, Map.of("projectId", projectId, "ownerUserId", ownerUserId));
    }

    public void publishInvitationSent(UUID invitationId, UUID projectId, UUID invitedUserId) {
        publish("project.invitation.sent", projectId,
                Map.of("invitationId", invitationId, "projectId", projectId, "invitedUserId", invitedUserId));
    }

    public void publishMemberJoined(UUID projectId, UUID userId) {
        publish("project.member.joined", projectId, Map.of("projectId", projectId, "userId", userId));
    }

    public void publishMemberRemoved(UUID projectId, UUID userId) {
        publish("project.member.removed", projectId, Map.of("projectId", projectId, "userId", userId));
    }

    private void publish(String topic, UUID key, Object payload) {
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(payload);
            kafkaTemplate.send(topic, key.toString(), bytes);
        } catch (Exception e) {
            log.error("Failed to publish event on topic {}", topic, e);
        }
    }
}
