package com.codemates.project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangeTaskStatusRequest {
    @NotBlank
    private String status; // TODO, IN_PROGRESS, REVIEW, DONE

    private Integer position; // new position within the column, optional
}
