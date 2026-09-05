package com.codemates.project.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class TaskCommentResponse {
    private UUID id;
    private UUID taskId;
    private UUID authorUserId;
    private String content;
    private Boolean isEdited;
    private Instant editedAt;
    private Instant createdAt;
}
