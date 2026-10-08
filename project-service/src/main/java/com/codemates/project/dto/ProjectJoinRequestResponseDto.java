package com.codemates.project.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProjectJoinRequestResponseDto {
    private UUID id;
    private UUID projectId;
    private UUID requestingUserId;
    private String status;
    private Instant respondedAt;
    private Instant createdAt;
}