package com.codemates.project.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProjectMemberResponseDto {
    private UUID id;
    private UUID projectId;
    private UUID userId;
    private String role;
    private Instant joinedAt;
    private UUID invitedByUserId;
}
