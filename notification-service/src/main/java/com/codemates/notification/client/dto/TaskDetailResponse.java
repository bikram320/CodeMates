package com.codemates.notification.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * UNVERIFIED ASSUMPTION - see README. This mirrors what we *expect* project-service's
 * GET /api/projects/{projectId}/tasks/{taskId} to return for the task's assignee, based on
 * the module description ("assignee-must-be-existing-member"). The actual TaskResponseDTO
 * class from project-service was not provided, so the field name "assigneeUserId" below is
 * a guess. If the real JSON field is named differently (e.g. "assignedToUserId", "assigneeId"),
 * this will silently deserialize to null (ignoreUnknown doesn't fail-fast on missing fields)
 * and task.status.changed notifications will not resolve a recipient. Confirm and fix this
 * field name against the real controller before relying on this in production.
 */
@Getter
@Setter
@JsonIgnoreProperties(ignoreUnknown = true)
public class TaskDetailResponse {
    private UUID id;
    private UUID projectId;
    private String title;
    private String status;
    private UUID assigneeUserId;
}
