package com.codemates.project.dto;

import lombok.Data;

@Data
public class UpdateProjectRequest {
    private String name;
    private String description;
    private String githubRepoUrl;
    private String status;     // ACTIVE, COMPLETED, ARCHIVED
    private String visibility; // PUBLIC, PRIVATE
    private String techStack;
    private Integer maxMembers;
}
