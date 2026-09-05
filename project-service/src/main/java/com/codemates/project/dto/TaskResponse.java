package com.codemates.project.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TaskResponse {
    private UUID id;
    private UUID projectId;
    private UUID createdByUserId;
    private UUID assignedToUserId;
    private String title;
    private String description;
    private String status;
    private String priority;
    private Instant dueDate;
    private Instant completedAt;
    private Integer position;
    private Instant createdAt;
    private Instant updatedAt;
}
