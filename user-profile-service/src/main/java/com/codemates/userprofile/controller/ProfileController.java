package com.codemates.userprofile.controller;

import com.codemates.userprofile.dto.*;
import com.codemates.userprofile.service.ProfileService;
import com.codemates.userprofile.service.JwtService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;
    private final JwtService jwtService;

    // GET /api/users/me
    // get own profile using userId from cookie
    @GetMapping("/me")
    public ResponseEntity<ApiResponse<ProfileResponse>> getMyProfile(
            HttpServletRequest request) {

        ProfileResponse profile = profileService
                .getProfileByUserId(extractUserId(request));

        return ResponseEntity.ok(
                ApiResponse.success("Profile fetched successfully", profile));
    }

    // GET /api/users/search
    // search developers by skills, experience level, interests,
    // and open-to-collaborate flag — all filters optional/combinable.
    // Public endpoint, no auth required (this powers discovery-service).
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<ProfileResponse>>> searchProfiles(
            @RequestParam(required = false) List<String> skills,
            @RequestParam(required = false) String experienceLevel,
            @RequestParam(required = false) List<String> interests,
            @RequestParam(required = false) Boolean openToCollaborate) {

        List<ProfileResponse> results = profileService.searchProfiles(
                skills, experienceLevel, interests, openToCollaborate);

        return ResponseEntity.ok(
                ApiResponse.success("Search results fetched", results));
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
            @Valid @RequestBody UpdateProfileRequest request,
            HttpServletRequest httpRequest) {

        ProfileResponse profile = profileService
                .updateProfile(extractUserId(httpRequest), request);

        return ResponseEntity.ok(
                ApiResponse.success("Profile updated successfully", profile));
    }

    // POST /api/users/me/skills
    // add skill to own profile
    @PostMapping("/me/skills")
    public ResponseEntity<ApiResponse<SkillResponse>> addSkill(
            @Valid @RequestBody AddSkillRequest request,
            HttpServletRequest httpRequest) {

        SkillResponse skill = profileService
                .addSkill(extractUserId(httpRequest), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Skill added successfully", skill));
    }

    // DELETE /api/users/me/skills/{skillId}
    // remove skill from own profile
    @DeleteMapping("/me/skills/{skillId}")
    public ResponseEntity<ApiResponse<Void>> removeSkill(
            @PathVariable UUID skillId,
            HttpServletRequest request) {

        profileService.removeSkill(extractUserId(request), skillId);

        return ResponseEntity.ok(
                ApiResponse.success("Skill removed successfully", null));
    }

    // POST /api/users/me/interests
    // add interest to own profile
    @PostMapping("/me/interests")
    public ResponseEntity<ApiResponse<InterestResponse>> addInterest(
            @Valid @RequestBody AddInterestRequest request,
            HttpServletRequest httpRequest) {

        InterestResponse interest = profileService
                .addInterest(extractUserId(httpRequest), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Interest added successfully", interest));
    }

    // DELETE /api/users/me/interests/{interestId}
    // remove interest from own profile
    @DeleteMapping("/me/interests/{interestId}")
    public ResponseEntity<ApiResponse<Void>> removeInterest(
            @PathVariable UUID interestId,
            HttpServletRequest request) {

        profileService.removeInterest(extractUserId(request), interestId);

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

    private UUID extractUserId(HttpServletRequest request) {
        if (request.getCookies() != null) {
            String token = Arrays.stream(request.getCookies())
                    .filter(c -> c.getName().equals("access_token"))
                    .map(Cookie::getValue)
                    .findFirst()
                    .orElse(null);

            if (token != null) {
                return jwtService.extractUserId(token);
            }
        }

        throw new IllegalArgumentException("User not authenticated");
    }
}
