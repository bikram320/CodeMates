package com.codemates.userprofile.service;

import com.codemates.userprofile.dto.*;
import com.codemates.userprofile.event.UserRegisteredEvent;
import com.codemates.userprofile.exception.ProfileNotFoundException;
import com.codemates.userprofile.model.Interest;
import com.codemates.userprofile.model.Profile;
import com.codemates.userprofile.model.Skill;
import com.codemates.userprofile.repository.InterestRepository;
import com.codemates.userprofile.repository.ProfileRepository;
import com.codemates.userprofile.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final SkillRepository skillRepository;
    private final InterestRepository interestRepository;
    private final ProfileWriter profileWriter;


    @Transactional
    public void createProfileFromEvent(UserRegisteredEvent event) {

        if (profileRepository.existsByUserIdAndIsDeletedFalse(event.getUserId())) {
            log.warn("Profile already exists for userId: {} — skipping", event.getUserId());
            return;
        }

        String username = event.getUsername();

        try {
            profileWriter.save(event, username);
        } catch (DataIntegrityViolationException e) {
            if (!isUsernameConstraintViolation(e)) {
                throw e;
            }
            String suffixedUsername = username + "-" + event.getUserId().toString().substring(0, 6);
            log.warn("Username '{}' already taken, retrying with '{}' for userId: {}",
                    username, suffixedUsername, event.getUserId());
            profileWriter.saveInNewTransaction(event, suffixedUsername);
        }
    }

    private boolean isUsernameConstraintViolation(DataIntegrityViolationException e) {
        String message = e.getMostSpecificCause().getMessage();
        return message != null && message.contains("profiles_username_key");
    }

    // Get profile by userId
    // called with JWT-extracted userId
    @Transactional(readOnly = true)
    public ProfileResponse getProfileByUserId(UUID userId) {
        Profile profile = profileRepository
                .findByUserIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ProfileNotFoundException(
                        "Profile not found for userId: " + userId));

        return buildProfileResponse(profile);
    }

    // Get profile by username
    // for public profile viewing
    @Transactional(readOnly = true)
    public ProfileResponse getProfileByUsername(String username) {
        Profile profile = profileRepository
                .findByUsernameAndIsDeletedFalse(username)
                .orElseThrow(() -> new ProfileNotFoundException(
                        "Profile not found for username: " + username));

        return buildProfileResponse(profile);
    }


    // Update profile
    // only updates fields that are provided
    @Transactional
    public ProfileResponse updateProfile(UUID userId,
                                         UpdateProfileRequest request) {

        Profile profile = profileRepository
                .findByUserIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ProfileNotFoundException(
                        "Profile not found for userId: " + userId));

        // only update fields that are not null
        if (request.getUsername() != null) {
            // check username not taken by someone else
            if (!request.getUsername().equals(profile.getUsername()) &&
                    profileRepository.existsByUsernameAndIsDeletedFalse(
                            request.getUsername())) {
                throw new IllegalArgumentException(
                        "Username already taken: " + request.getUsername());
            }
            profile.setUsername(request.getUsername());
        }

        if (request.getFullName() != null) {
            profile.setFullName(request.getFullName());
        }
        if (request.getBio() != null) {
            profile.setBio(request.getBio());
        }
        if (request.getAvatarUrl() != null) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }
        if (request.getExperienceLevel() != null) {
            profile.setExperienceLevel(request.getExperienceLevel());
        }
        if (request.getPortfolioUrl() != null) {
            profile.setPortfolioUrl(request.getPortfolioUrl());
        }
        if (request.getLinkedinUrl() != null) {
            profile.setLinkedinUrl(request.getLinkedinUrl());
        }
        if (request.getGithubUsername() != null) {
            profile.setGithubUsername(request.getGithubUsername());
        }
        if (request.getIsOpenToCollaborate() != null) {
            profile.setIsOpenToCollaborate(request.getIsOpenToCollaborate());
        }
        if (request.getActivityStatus() != null) {
            profile.setActivityStatus(request.getActivityStatus());
        }

        profileRepository.save(profile);
        log.info("Profile updated for userId: {}", userId);

        return buildProfileResponse(profile);
    }


    // Add skill to profile
    @Transactional
    public SkillResponse addSkill(UUID userId, AddSkillRequest request) {
        Profile profile = profileRepository
                .findByUserIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ProfileNotFoundException(
                        "Profile not found for userId: " + userId));

        // prevent duplicate skills
        if (skillRepository.existsByProfileIdAndSkillNameAndIsDeletedFalse(
                profile.getId(), request.getSkillName())) {
            throw new IllegalArgumentException(
                    "Skill already exists: " + request.getSkillName());
        }

        Skill skill = Skill.builder()
                .profileId(profile.getId())
                .skillName(request.getSkillName())
                .proficiencyLevel(request.getProficiencyLevel() != null
                        ? request.getProficiencyLevel() : "BEGINNER")
                .yearsOfExperience(request.getYearsOfExperience() != null
                        ? request.getYearsOfExperience() : 0)
                .isDeleted(false)
                .build();

        Skill saved = skillRepository.save(skill);
        log.info("Skill added: {} for userId: {}", request.getSkillName(), userId);

        return SkillResponse.builder()
                .id(saved.getId())
                .skillName(saved.getSkillName())
                .proficiencyLevel(saved.getProficiencyLevel())
                .yearsOfExperience(saved.getYearsOfExperience())
                .build();
    }

    // Remove skill (soft delete)
    @Transactional
    public void removeSkill(UUID userId, UUID skillId) {
        Profile profile = profileRepository
                .findByUserIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ProfileNotFoundException(
                        "Profile not found for userId: " + userId));

        Skill skill = skillRepository.findById(skillId)
                .orElseThrow(() -> new ProfileNotFoundException(
                        "Skill not found: " + skillId));

        // make sure the skill belongs to this user's profile
        if (!skill.getProfileId().equals(profile.getId())) {
            throw new IllegalArgumentException(
                    "Skill does not belong to this profile");
        }

        skill.setIsDeleted(true);
        skill.setDeletedAt(java.time.LocalDateTime.now());
        skillRepository.save(skill);
        log.info("Skill removed: {} for userId: {}", skillId, userId);
    }

    // Add interest to profile
    @Transactional
    public InterestResponse addInterest(UUID userId,
                                        AddInterestRequest request) {

        Profile profile = profileRepository
                .findByUserIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ProfileNotFoundException(
                        "Profile not found for userId: " + userId));

        // prevent duplicate interests
        if (interestRepository
                .existsByProfileIdAndInterestNameAndIsDeletedFalse(
                        profile.getId(), request.getInterestName())) {
            throw new IllegalArgumentException(
                    "Interest already exists: " + request.getInterestName());
        }

        Interest interest = Interest.builder()
                .profileId(profile.getId())
                .interestName(request.getInterestName())
                .isDeleted(false)
                .build();

        Interest saved = interestRepository.save(interest);
        log.info("Interest added: {} for userId: {}",
                request.getInterestName(), userId);

        return InterestResponse.builder()
                .id(saved.getId())
                .interestName(saved.getInterestName())
                .build();
    }

    // Remove interest (soft delete)
    @Transactional
    public void removeInterest(UUID userId, UUID interestId) {
        Profile profile = profileRepository
                .findByUserIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new ProfileNotFoundException(
                        "Profile not found for userId: " + userId));

        Interest interest = interestRepository.findById(interestId)
                .orElseThrow(() -> new ProfileNotFoundException(
                        "Interest not found: " + interestId));

        if (!interest.getProfileId().equals(profile.getId())) {
            throw new IllegalArgumentException(
                    "Interest does not belong to this profile");
        }

        interest.setIsDeleted(true);
        interest.setDeletedAt(java.time.LocalDateTime.now());
        interestRepository.save(interest);
        log.info("Interest removed: {} for userId: {}", interestId, userId);
    }

    // ── added for discovery-service ──────────────────────
    // Search profiles by skills, experience level, interests,
    // and open-to-collaborate flag. All filters optional and
    // combinable. Capped at 50 results (no pagination for now).
    @Transactional(readOnly = true)
    public List<ProfileResponse> searchProfiles(List<String> skills,
                                                String experienceLevel,
                                                List<String> interests,
                                                Boolean openToCollaborate) {

        Set<UUID> skillProfileIds = null;
        if (skills != null && !skills.isEmpty()) {
            skillProfileIds = skillRepository
                    .findBySkillNameInAndIsDeletedFalse(skills).stream()
                    .map(Skill::getProfileId)
                    .collect(Collectors.toSet());
        }

        Set<UUID> interestProfileIds = null;
        if (interests != null && !interests.isEmpty()) {
            interestProfileIds = interestRepository
                    .findByInterestNameInAndIsDeletedFalse(interests).stream()
                    .map(Interest::getProfileId)
                    .collect(Collectors.toSet());
        }

        boolean hasExperience = experienceLevel != null && !experienceLevel.isBlank();
        boolean hasOpenFlag = openToCollaborate != null;

        List<Profile> baseProfiles;
        if (hasExperience && hasOpenFlag) {
            baseProfiles = profileRepository
                    .findByExperienceLevelAndIsOpenToCollaborateAndIsDeletedFalse(
                            experienceLevel, openToCollaborate);
        } else if (hasExperience) {
            baseProfiles = profileRepository
                    .findByExperienceLevelAndIsDeletedFalse(experienceLevel);
        } else if (hasOpenFlag) {
            baseProfiles = profileRepository
                    .findByIsOpenToCollaborateAndIsDeletedFalse(openToCollaborate);
        } else {
            baseProfiles = profileRepository.findByIsDeletedFalse();
        }

        final Set<UUID> finalSkillIds = skillProfileIds;
        final Set<UUID> finalInterestIds = interestProfileIds;

        return baseProfiles.stream()
                .filter(p -> finalSkillIds == null || finalSkillIds.contains(p.getId()))
                .filter(p -> finalInterestIds == null || finalInterestIds.contains(p.getId()))
                .limit(50)
                .map(this::buildProfileResponse)
                .collect(Collectors.toList());
    }

    // ── added for connections page ───────────────────────
    // Batch-resolve user IDs to public profiles. ConnectionSummaryDto /
    // ConnectionResponseDto (social-service) only ever carry raw
    // otherUserId/senderUserId — this is the only way the frontend can turn
    // those into a name/avatar/skills without hitting /search per-user.
    @Transactional(readOnly = true)
    public List<ProfileResponse> getProfilesByUserIds(List<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return List.of();
        }
        return profileRepository.findByUserIdInAndIsDeletedFalse(userIds).stream()
                .map(this::buildProfileResponse)
                .collect(Collectors.toList());
    }

    // Internal — build full profile response
    // with skills and interests
    private ProfileResponse buildProfileResponse(Profile profile) {
        List<SkillResponse> skills = skillRepository
                .findByProfileIdAndIsDeletedFalse(profile.getId())
                .stream()
                .map(skill -> SkillResponse.builder()
                        .id(skill.getId())
                        .skillName(skill.getSkillName())
                        .proficiencyLevel(skill.getProficiencyLevel())
                        .yearsOfExperience(skill.getYearsOfExperience())
                        .build())
                .toList();

        List<InterestResponse> interests = interestRepository
                .findByProfileIdAndIsDeletedFalse(profile.getId())
                .stream()
                .map(interest -> InterestResponse.builder()
                        .id(interest.getId())
                        .interestName(interest.getInterestName())
                        .build())
                .toList();

        return ProfileResponse.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .username(profile.getUsername())
                .fullName(profile.getFullName())
                .bio(profile.getBio())
                .avatarUrl(profile.getAvatarUrl())
                .experienceLevel(profile.getExperienceLevel())
                .portfolioUrl(profile.getPortfolioUrl())
                .linkedinUrl(profile.getLinkedinUrl())
                .githubUsername(profile.getGithubUsername())
                .isOpenToCollaborate(profile.getIsOpenToCollaborate())
                .activityStatus(profile.getActivityStatus())
                .skills(skills)
                .interests(interests)
                .createdAt(profile.getCreatedAt())
                .build();
    }
}
