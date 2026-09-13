package com.codemates.contribution.event.dto;

import lombok.Data;

import java.util.UUID;

/**
 * Mirrors the Map published by TaskEventProducer.publishTaskCompleted:
 * {taskId, projectId, completedByUserId}
 */
@Data
public class TaskCompletedEvent {
    private UUID taskId;
    private UUID projectId;
    private UUID completedByUserId;
}
