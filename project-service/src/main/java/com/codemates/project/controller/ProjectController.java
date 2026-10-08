package com.codemates.project.controller;

import com.codemates.project.dto.*;
import com.codemates.project.security.JwtCookieExtractor;
import com.codemates.project.service.ProjectService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final JwtCookieExtractor jwtCookieExtractor;

    @PostMapping
    public ResponseEntity<ApiResponse<ProjectResponse>> create(
            HttpServletRequest request, @Valid @RequestBody CreateProjectRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Project created", projectService.createProject(userId, dto)));
    }

    @PutMapping("/{id}")
    public ApiResponse<ProjectResponse> update(
            HttpServletRequest request, @PathVariable UUID id, @RequestBody UpdateProjectRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Project updated", projectService.updateProject(userId, id, dto));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        projectService.deleteProject(userId, id);
        return ApiResponse.success("Project deleted", null);
    }

    @GetMapping("/{id}")
    public ApiResponse<ProjectResponse> getById(HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Project fetched", projectService.getProject(id, userId));
    }

    @GetMapping("/my")
    public ApiResponse<List<ProjectResponse>> myProjects(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Projects fetched", projectService.getMyProjects(userId));
    }

    /**
     * Browse other users' PUBLIC projects (Discover Projects page).
     * Distinct from /my: this excludes projects the caller already owns or
     * has joined — see ProjectService.discoverProjects for why (a "discover"
     * feed showing your own projects back to you isn't discovery).
     *
     * All filter params are optional; omitting all of them returns every
     * PUBLIC project (still capped — see the service).
     *
     * techStack matches if the project's techStack contains ANY of the
     * given values (OR, not AND) — same convention as discovery-service's
     * skills param for developers.
     */
    @GetMapping("/discover")
    public ApiResponse<List<ProjectResponse>> discover(
            HttpServletRequest request,
            @RequestParam(required = false) List<String> techStack,
            @RequestParam(required = false) String projectType,
            @RequestParam(required = false) String requiredExperience,
            @RequestParam(required = false) String status) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success(
                "Projects fetched",
                projectService.discoverProjects(userId, techStack, projectType, requiredExperience, status));
    }

    @PostMapping("/{id}/invitations")
    public ApiResponse<ProjectInvitationResponseDto> invite(
            HttpServletRequest request, @PathVariable UUID id, @Valid @RequestBody InviteMemberRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Invitation sent", projectService.inviteMember(userId, id, dto));
    }

    @PutMapping("/invitations/{invitationId}/accept")
    public ApiResponse<ProjectMemberResponseDto> accept(HttpServletRequest request, @PathVariable UUID invitationId) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Invitation accepted", projectService.acceptInvitation(userId, invitationId));
    }

    @PutMapping("/invitations/{invitationId}/reject")
    public ApiResponse<ProjectInvitationResponseDto> reject(HttpServletRequest request, @PathVariable UUID invitationId) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Invitation rejected", projectService.rejectInvitation(userId, invitationId));
    }

    @GetMapping("/invitations/pending")
    public ApiResponse<List<ProjectInvitationResponseDto>> pendingInvitations(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Pending invitations fetched", projectService.getPendingInvitations(userId));
    }

    @DeleteMapping("/{id}/members/{memberUserId}")
    public ApiResponse<Void> removeMember(
            HttpServletRequest request, @PathVariable UUID id, @PathVariable UUID memberUserId) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        projectService.removeMember(userId, id, memberUserId);
        return ApiResponse.success("Member removed", null);
    }

    @PutMapping("/{id}/members/{memberUserId}/role")
    public ApiResponse<ProjectMemberResponseDto> changeRole(
            HttpServletRequest request, @PathVariable UUID id,
            @PathVariable UUID memberUserId, @Valid @RequestBody ChangeRoleRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Role updated", projectService.changeRole(userId, id, memberUserId, dto.getRole()));
    }

    @GetMapping("/{id}/members")
    public ApiResponse<List<ProjectMemberResponseDto>> members(HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Members fetched", projectService.getProjectMembers(id, userId));
    }

    @GetMapping("/{id}/members/{userId}/check")
    public ApiResponse<MembershipCheckResponse> checkMembership(
            @PathVariable UUID id, @PathVariable UUID userId) {
        return ApiResponse.success("Membership checked", projectService.checkMembership(id, userId));
    }

    // ── JOIN REQUESTS ──────────────────────────

    @PostMapping("/{id}/join-requests")
    public ResponseEntity<ApiResponse<ProjectJoinRequestResponseDto>> requestToJoin(
            HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Join request sent", projectService.requestToJoin(userId, id)));
    }

    @GetMapping("/{id}/join-requests")
    public ApiResponse<List<ProjectJoinRequestResponseDto>> pendingJoinRequests(
            HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Join requests fetched", projectService.getPendingJoinRequests(userId, id));
    }

    @PutMapping("/join-requests/{joinRequestId}/accept")
    public ApiResponse<ProjectMemberResponseDto> acceptJoinRequest(
            HttpServletRequest request, @PathVariable UUID joinRequestId) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Join request accepted", projectService.acceptJoinRequest(userId, joinRequestId));
    }

    @PutMapping("/join-requests/{joinRequestId}/reject")
    public ApiResponse<ProjectJoinRequestResponseDto> rejectJoinRequest(
            HttpServletRequest request, @PathVariable UUID joinRequestId) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Join request rejected", projectService.rejectJoinRequest(userId, joinRequestId));
    }

    @PutMapping("/join-requests/{joinRequestId}/cancel")
    public ApiResponse<ProjectJoinRequestResponseDto> cancelJoinRequest(
            HttpServletRequest request, @PathVariable UUID joinRequestId) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Join request cancelled", projectService.cancelJoinRequest(userId, joinRequestId));
    }

    @GetMapping("/join-requests/my")
    public ApiResponse<List<ProjectJoinRequestResponseDto>> myJoinRequests(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Your join requests fetched", projectService.getMyJoinRequests(userId));
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Project service is running", null);
    }
}