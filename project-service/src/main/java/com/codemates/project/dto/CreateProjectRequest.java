package com.codemates.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateProjectRequest {
    @NotBlank @Size(max = 150)
    private String name;

    private String description;

    @Size(max = 500)
    private String githubRepoUrl;

    private String visibility; // defaults to PRIVATE if null

    @Size(max = 500)
    private String techStack;

    private Integer maxMembers; // defaults to 10 if null
}
