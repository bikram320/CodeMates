package com.codemates.userprofile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddInterestRequest {

    @NotBlank(message = "Interest name is required")
    @Size(max = 100, message = "Interest name must be at most 100 characters")
    private String interestName;
}