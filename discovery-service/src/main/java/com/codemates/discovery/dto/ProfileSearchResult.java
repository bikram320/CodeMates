package com.codemates.discovery.dto;

import lombok.Data;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Mirrors the shape of ProfileResponse returned by
 * user-profile-service's /api/users/search endpoint.
 * Kept as a separate, lighter DTO here since discovery-service
 * doesn't own this data — it's just relaying it.
 */
@Data
public class ProfileSearchResult {
    private UUID userId;
    private String username;
    private String fullName;
    private String bio;
    private String avatarUrl;
    private String experienceLevel;
    private String githubUsername;
    private Boolean isOpenToCollaborate;
    private String activityStatus;
    private List<SkillDto> skills;
    private List<InterestDto> interests;
    private Instant createdAt;

    @Data
    public static class SkillDto {
        private UUID id;
        private String skillName;
        private String proficiencyLevel;
        private Integer yearsOfExperience;
    }

    @Data
    public static class InterestDto {
        private UUID id;
        private String interestName;
    }
}
