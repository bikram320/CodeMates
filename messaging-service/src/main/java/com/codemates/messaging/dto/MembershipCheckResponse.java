package com.codemates.messaging.dto;

import lombok.Data;

/**
 * Mirrors the response shape returned by project-service's
 * GET /api/projects/{id}/members/{userId}/check endpoint.
 */
@Data
public class MembershipCheckResponse {
    private boolean isMember;
    private String role;
}
