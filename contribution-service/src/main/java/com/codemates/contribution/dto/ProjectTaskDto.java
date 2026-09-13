package com.codemates.contribution.dto;

import lombok.Data;

import java.util.UUID;

/**
 * Minimal mirror of project-service's TaskResponse — only the fields
 * contribution-service actually needs (priority, for scoring). Jackson
 * ignores unknown fields from the real response by default, so extra
 * fields on the source DTO are harmless.
 */
@Data
public class ProjectTaskDto {
    private UUID id;
    private UUID projectId;
    private String priority;
}
