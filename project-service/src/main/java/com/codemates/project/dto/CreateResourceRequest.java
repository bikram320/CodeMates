package com.codemates.project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateResourceRequest {

    @NotBlank(message = "name is required")
    private String name;

    @NotBlank(message = "url is required")
    private String url;

    private String description;

    // optional — defaults to "LINK" in the service if omitted
    private String resourceType;
}