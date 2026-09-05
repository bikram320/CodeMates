package com.codemates.project.dto;

import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Data
@Builder
public class ProjectResponse {
    private UUID id;
    private UUID ownerUserId;
    private String name;
    private String description;
    private String githubRepoUrl;
    private String status;
    private String visibility;
    private String techStack;
    private Integer maxMembers;
    private long memberCount;
    private Instant createdAt;
}
