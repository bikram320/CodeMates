package com.codemates.project.dto;

import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class UpdateTaskRequest {
    private String title;
    private String description;
    private UUID assignedToUserId;
    private String priority;
    private Instant dueDate;
}
