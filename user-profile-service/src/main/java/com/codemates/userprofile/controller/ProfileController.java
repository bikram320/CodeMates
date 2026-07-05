package com.codemates.userprofile.controller;

import com.codemates.userprofile.dto.*;
import com.codemates.userprofile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    // GET /api/users/me
    // get own profile using userId from header
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> getMyProfile(
            @RequestHeader("X-User-Id") String userId) {

        ProfileResponse profile = profileService
                .getProfileByUserId(UUID.fromString(userId));

        return ResponseEntity.ok(
                ApiResponse.success("Profile fetched successfully", profile));
    }


    // GET /api/users/{username}
    // get public profile by username
    @GetMapping("/{username}")
    public ResponseEntity<ApiResponse<ProfileResponse>> getProfileByUsername(
            @PathVariable String username) {

        ProfileResponse profile = profileService
                .getProfileByUsername(username);

        return ResponseEntity.ok(
                ApiResponse.success("Profile fetched successfully", profile));
    }

    // PUT /api/users/me
    // update own profile
    @PutMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> updateProfile(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody UpdateProfileRequest request) {

        ProfileResponse profile = profileService
                .updateProfile(UUID.fromString(userId), request);

        return ResponseEntity.ok(
                ApiResponse.success("Profile updated successfully", profile));
    }

    // POST /api/users/me/skills
    // add skill to own profile
    @PostMapping("/me/skills")
    public ResponseEntity<ApiResponse<SkillResponse>> addSkill(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody AddSkillRequest request) {

        SkillResponse skill = profileService
                .addSkill(UUID.fromString(userId), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill added successfully", skill));
    }

    // DELETE /api/users/me/skills/{skillId}
    // remove skill from own profile
    @DeleteMapping("/me/skills/{skillId}")
    public ResponseEntity<ApiResponse<Void>> removeSkill(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID skillId) {

        profileService.removeSkill(UUID.fromString(userId), skillId);

        return ResponseEntity.ok(
                ApiResponse.success("Skill removed successfully", null));
    }

    // POST /api/users/me/interests
    // add interest to own profile
    @PostMapping("/me/interests")
    public ResponseEntity<ApiResponse<InterestResponse>> addInterest(
            @RequestHeader("X-User-Id") String userId,
            @Valid @RequestBody AddInterestRequest request) {

        InterestResponse interest = profileService
                .addInterest(UUID.fromString(userId), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Interest added successfully", interest));
    }

    // DELETE /api/users/me/interests/{interestId}
    // remove interest from own profile
    @DeleteMapping("/me/interests/{interestId}")
    public ResponseEntity<ApiResponse<Void>> removeInterest(
            @RequestHeader("X-User-Id") String userId,
            @PathVariable UUID interestId) {

        profileService.removeInterest(UUID.fromString(userId), interestId);

        return ResponseEntity.ok(
                ApiResponse.success("Interest removed successfully", null));
    }

    // GET /api/users/health
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(
                ApiResponse.success(
                        "User profile service is running", null));
    }
}