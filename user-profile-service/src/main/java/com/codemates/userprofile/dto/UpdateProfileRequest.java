package com.codemates.userprofile.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateProfileRequest {

    @Size(max = 50, message = "Username must be at most 50 characters")
    private String username;

    @Size(max = 100, message = "Full name must be at most 100 characters")
    private String fullName;

    private String bio;

    @Size(max = 500)
    private String avatarUrl;

    private String experienceLevel;
    // BEGINNER | INTERMEDIATE | ADVANCED | EXPERT

    @Size(max = 500)
    private String portfolioUrl;

    @Size(max = 500)
    private String linkedinUrl;

    @Size(max = 100)
    private String githubUsername;

    private Boolean isOpenToCollaborate;

    private String activityStatus;
    // ACTIVE | AWAY | BUSY | OFFLINE
}