package com.codemates.notification.listener;

import com.codemates.notification.service.NotificationService;
import com.codemates.notification.service.NotificationType;
import com.codemates.notification.service.ReferenceType;
import com.codemates.notification.service.UserContactService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.UUID;

/**
 * project-service's ProjectEventProducer publishes plain Map.of(...) payloads (not named
 * event classes), so these are parsed as Map<String,Object> here rather than typed DTOs.
 * Field values are UUIDs but arrive as JSON strings (both tools.jackson and classic jackson
 * serialize UUID the same way), so UUID.fromString(...toString()) is used throughout.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProjectEventListener {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final UserContactService userContactService;

    @KafkaListener(topics = "project.created", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handleProjectCreated(byte[] payload) {
        try {
            Map<?, ?> map = objectMapper.readValue(payload, Map.class);
            UUID projectId = UUID.fromString(map.get("projectId").toString());
            UUID ownerUserId = UUID.fromString(map.get("ownerUserId").toString());

            // Self-notification (low value, included per "notify on all events" scope) -
            // easy to drop later if it turns out to just be noise for the owner.
            notificationService.create(
                    ownerUserId, null, NotificationType.PROJECT_CREATED,
                    "Project created",
                    "Your project was created successfully.",
                    projectId, ReferenceType.PROJECT, false);
        } catch (Exception e) {
            log.error("Failed to process project.created event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "project.invitation.sent", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handleInvitationSent(byte[] payload) {
        try {
            Map<?, ?> map = objectMapper.readValue(payload, Map.class);
            UUID invitationId = UUID.fromString(map.get("invitationId").toString());
            UUID projectId = UUID.fromString(map.get("projectId").toString());
            UUID invitedUserId = UUID.fromString(map.get("invitedUserId").toString());

            notificationService.create(
                    invitedUserId, null, NotificationType.PROJECT_INVITATION,
                    "You've been invited to a project",
                    "You've been invited to join a project on CodeMates. The invitation expires in 7 days.",
                    invitationId, ReferenceType.INVITATION, true); // high-signal - email
        } catch (Exception e) {
            log.error("Failed to process project.invitation.sent event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "project.member.joined", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handleMemberJoined(byte[] payload) {
        try {
            Map<?, ?> map = objectMapper.readValue(payload, Map.class);
            UUID projectId = UUID.fromString(map.get("projectId").toString());
            UUID userId = UUID.fromString(map.get("userId").toString());

            notificationService.create(
                    userId, null, NotificationType.PROJECT_MEMBER_JOINED,
                    "You joined a project",
                    "You've successfully joined the project.",
                    projectId, ReferenceType.PROJECT, false);
        } catch (Exception e) {
            log.error("Failed to process project.member.joined event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "project.member.removed", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handleMemberRemoved(byte[] payload) {
        try {
            Map<?, ?> map = objectMapper.readValue(payload, Map.class);
            UUID projectId = UUID.fromString(map.get("projectId").toString());
            UUID userId = UUID.fromString(map.get("userId").toString());

            notificationService.create(
                    userId, null, NotificationType.PROJECT_MEMBER_REMOVED,
                    "You were removed from a project",
                    "You are no longer a member of a project you were part of.",
                    projectId, ReferenceType.PROJECT, false);
        } catch (Exception e) {
            log.error("Failed to process project.member.removed event: {}", e.getMessage(), e);
        }
    }
}
