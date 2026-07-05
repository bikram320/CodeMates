package com.codemates.userprofile.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddSkillRequest {

    @NotBlank(message = "Skill name is required")
    @Size(max = 100, message = "Skill name must be at most 100 characters")
    private String skillName;

    @Size(max = 20)
    private String proficiencyLevel = "BEGINNER";

    @Min(value = 0, message = "Years of experience cannot be negative")
    private Integer yearsOfExperience = 0;
}