package com.codemates.project.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * Response for GET /api/projects/{id}/members/{userId}/check — built for
 * messaging-service to do a cheap per-request membership check without
 * pulling the full member list.
 */
@Data
@AllArgsConstructor
public class MembershipCheckResponse {
    @JsonProperty("isMember")
    private boolean isMember;

    private String role; // null when isMember is false
}
