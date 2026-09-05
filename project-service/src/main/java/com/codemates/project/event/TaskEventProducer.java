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
public class TaskEventProducer {

    private final KafkaTemplate<String, byte[]> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishTaskCreated(UUID taskId, UUID projectId, UUID createdByUserId) {
        publish("task.created", taskId,
                Map.of("taskId", taskId, "projectId", projectId, "createdByUserId", createdByUserId));
    }

    public void publishTaskAssigned(UUID taskId, UUID projectId, UUID assignedToUserId) {
        publish("task.assigned", taskId,
                Map.of("taskId", taskId, "projectId", projectId, "assignedToUserId", assignedToUserId));
    }

    public void publishTaskStatusChanged(UUID taskId, UUID projectId, String oldStatus, String newStatus) {
        publish("task.status.changed", taskId,
                Map.of("taskId", taskId, "projectId", projectId, "oldStatus", oldStatus, "newStatus", newStatus));
    }

    public void publishTaskCompleted(UUID taskId, UUID projectId, UUID completedByUserId) {
        publish("task.completed", taskId,
                Map.of("taskId", taskId, "projectId", projectId, "completedByUserId", completedByUserId));
    }

    public void publishCommentAdded(UUID commentId, UUID taskId, UUID authorUserId) {
        publish("task.comment.added", taskId,
                Map.of("commentId", commentId, "taskId", taskId, "authorUserId", authorUserId));
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
