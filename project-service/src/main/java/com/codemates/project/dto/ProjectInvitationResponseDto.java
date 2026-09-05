package com.codemates.project.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProjectInvitationResponseDto {
    private UUID id;
    private UUID projectId;
    private UUID invitedUserId;
    private UUID invitedByUserId;
    private String role;
    private String status;
    private Instant expiresAt;
    private Instant respondedAt;
    private Instant createdAt;
}
