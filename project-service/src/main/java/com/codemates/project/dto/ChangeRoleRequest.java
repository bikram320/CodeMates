package com.codemates.project.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ChangeRoleRequest {
    @NotBlank
    private String role;
}
