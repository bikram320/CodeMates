package com.codemates.userprofile.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileResponse {

    private UUID id;
    private UUID userId;
    private String username;
    private String fullName;
    private String bio;
    private String avatarUrl;
    private String experienceLevel;
    private String portfolioUrl;
    private String linkedinUrl;
    private String githubUsername;
    private Boolean isOpenToCollaborate;
    private String activityStatus;
    private List<SkillResponse> skills;
    private List<InterestResponse> interests;
    private LocalDateTime createdAt;
}