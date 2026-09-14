package com.codemates.notification.listener;

import com.codemates.notification.client.ProjectServiceClient;
import com.codemates.notification.client.dto.TaskDetailResponse;
import com.codemates.notification.service.NotificationService;
import com.codemates.notification.service.NotificationType;
import com.codemates.notification.service.ReferenceType;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * NOTE: task.comment.added is intentionally NOT consumed here. Its payload
 * {commentId, taskId, authorUserId} has no projectId, so we can't call project-service's
 * GET /api/projects/{projectId}/tasks/{taskId} to resolve the assignee/LEADER(s) who should
 * be notified. Fix: add projectId to TaskEventProducer.publishCommentAdded, then add a
 * listener here following the same pattern as handleStatusChanged below. See README.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TaskEventListener {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final ProjectServiceClient projectServiceClient;

    @KafkaListener(topics = "task.created", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handleTaskCreated(byte[] payload) {
        try {
            Map<?, ?> map = objectMapper.readValue(payload, Map.class);
            UUID taskId = UUID.fromString(map.get("taskId").toString());
            UUID createdByUserId = UUID.fromString(map.get("createdByUserId").toString());

            // Self-notification (low value, included per "notify on all events" scope).
            notificationService.create(
                    createdByUserId, null, NotificationType.TASK_CREATED,
                    "Task created",
                    "Your task was created successfully.",
                    taskId, ReferenceType.TASK, false);
        } catch (Exception e) {
            log.error("Failed to process task.created event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "task.assigned", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handleTaskAssigned(byte[] payload) {
        try {
            Map<?, ?> map = objectMapper.readValue(payload, Map.class);
            UUID taskId = UUID.fromString(map.get("taskId").toString());
            UUID assignedToUserId = UUID.fromString(map.get("assignedToUserId").toString());

            notificationService.create(
                    assignedToUserId, null, NotificationType.TASK_ASSIGNED,
                    "You've been assigned a task",
                    "A task has been assigned to you.",
                    taskId, ReferenceType.TASK, true); // high-signal - email
        } catch (Exception e) {
            log.error("Failed to process task.assigned event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "task.status.changed", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handleStatusChanged(byte[] payload) {
        try {
            Map<?, ?> map = objectMapper.readValue(payload, Map.class);
            UUID taskId = UUID.fromString(map.get("taskId").toString());
            UUID projectId = UUID.fromString(map.get("projectId").toString());
            String newStatus = String.valueOf(map.get("newStatus"));

            // No actor field on this event (known gap - can't tell who made the change),
            // so this may notify the assignee about their own change. Acceptable for now.
            Optional<TaskDetailResponse> task = projectServiceClient.getTask(projectId, taskId);
            task.map(TaskDetailResponse::getAssigneeUserId).ifPresentOrElse(
                    assigneeUserId -> notificationService.create(
                            assigneeUserId, null, NotificationType.TASK_STATUS_CHANGED,
                            "Task status updated",
                            "One of your tasks moved to " + newStatus + ".",
                            taskId, ReferenceType.TASK, false),
                    () -> log.warn("Could not resolve assignee for task {} (project-service lookup failed or " +
                            "TaskDetailResponse.assigneeUserId field name is wrong) - skipping notification", taskId)
            );
        } catch (Exception e) {
            log.error("Failed to process task.status.changed event: {}", e.getMessage(), e);
        }
    }

    @KafkaListener(topics = "task.completed", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handleTaskCompleted(byte[] payload) {
        try {
            Map<?, ?> map = objectMapper.readValue(payload, Map.class);
            UUID taskId = UUID.fromString(map.get("taskId").toString());
            UUID completedByUserId = UUID.fromString(map.get("completedByUserId").toString());

            // Self-notification, deliberately avoids needing a LEADER lookup for v1.
            notificationService.create(
                    completedByUserId, null, NotificationType.TASK_COMPLETED,
                    "Task completed",
                    "Nice work - you marked a task as done.",
                    taskId, ReferenceType.TASK, false);
        } catch (Exception e) {
            log.error("Failed to process task.completed event: {}", e.getMessage(), e);
        }
    }
}
