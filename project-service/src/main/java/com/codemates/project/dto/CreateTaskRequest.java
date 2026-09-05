package com.codemates.project.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.Instant;
import java.util.UUID;

@Data
public class CreateTaskRequest {
    @NotBlank @Size(max = 255)
    private String title;

    private String description;

    private UUID assignedToUserId; // optional — unassigned if null

    private String priority; // defaults to MEDIUM if null

    private Instant dueDate;

    private Integer position; // defaults to 0 if null
}
