package com.codemates.project.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ResourceResponse {
    private UUID id;
    private UUID projectId;
    private UUID uploadedByUserId;
    private String name;
    private String url;
    private String description;
    private String resourceType;
    private Instant createdAt;
}