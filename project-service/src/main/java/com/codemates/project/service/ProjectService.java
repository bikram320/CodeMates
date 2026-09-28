package com.codemates.project.service;

import com.codemates.project.dto.*;
import com.codemates.project.event.ProjectEventProducer;
import com.codemates.project.exception.*;
import com.codemates.project.model.Project;
import com.codemates.project.model.ProjectInvitation;
import com.codemates.project.model.ProjectJoinRequest;
import com.codemates.project.model.ProjectMember;
import com.codemates.project.repository.ProjectInvitationRepository;
import com.codemates.project.repository.ProjectJoinRequestRepository;
import com.codemates.project.repository.ProjectMemberRepository;
import com.codemates.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final List<String> VALID_ROLES = List.of("LEADER", "CONTRIBUTOR", "REVIEWER");
    private static final List<String> VALID_STATUSES = List.of("ACTIVE", "COMPLETED", "ARCHIVED");
    private static final List<String> VALID_VISIBILITY = List.of("PUBLIC", "PRIVATE");

    // Discover Projects has no pagination yet — same style cap discovery-service
    // already uses for developer search, so one slow/huge query can't take the
    // page down while this is still a simple in-memory filter.
    private static final int DISCOVER_RESULT_CAP = 50;

    private final ProjectJoinRequestRepository projectJoinRequestRepository;
    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectInvitationRepository projectInvitationRepository;
    private final ProjectEventProducer eventProducer;

    // ── CREATE ──────────────────────────────
    @Transactional
    public ProjectResponse createProject(UUID ownerUserId, CreateProjectRequest request) {

        String visibility = request.getVisibility() != null ? request.getVisibility().toUpperCase() : "PRIVATE";
        if (!VALID_VISIBILITY.contains(visibility)) {
            throw new InvalidProjectStateException("Invalid visibility: " + visibility);
        }

        Project project = new Project();
        project.setOwnerUserId(ownerUserId);
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setGithubRepoUrl(request.getGithubRepoUrl());
        project.setStatus("ACTIVE");
        project.setVisibility(visibility);
        project.setTechStack(request.getTechStack());
        project.setMaxMembers(request.getMaxMembers() != null ? request.getMaxMembers() : 10);
        project.setIsDeleted(false);

        Project saved = projectRepository.save(project);

        // auto-add creator as LEADER member directly (no invitation needed for self)
        ProjectMember leader = new ProjectMember();
        leader.setProjectId(saved.getId());
        leader.setUserId(ownerUserId);
        leader.setRole("LEADER");
        leader.setJoinedAt(Instant.now());
        leader.setInvitedByUserId(ownerUserId);
        leader.setIsDeleted(false);
        projectMemberRepository.save(leader);

        eventProducer.publishProjectCreated(saved.getId(), ownerUserId);
        log.info("Project created: {} by owner {}", saved.getId(), ownerUserId);

        return toProjectResponse(saved);
    }

    // ── UPDATE ──────────────────────────────
    @Transactional
    public ProjectResponse updateProject(UUID userId, UUID projectId, UpdateProjectRequest request) {
        Project project = getActiveOrThrow(projectId);
        requireRole(projectId, userId, "LEADER");

        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getGithubRepoUrl() != null) project.setGithubRepoUrl(request.getGithubRepoUrl());
        if (request.getTechStack() != null) project.setTechStack(request.getTechStack());
        if (request.getMaxMembers() != null) project.setMaxMembers(request.getMaxMembers());

        if (request.getStatus() != null) {
            String status = request.getStatus().toUpperCase();
            if (!VALID_STATUSES.contains(status)) {
                throw new InvalidProjectStateException("Invalid status: " + status);
            }
            project.setStatus(status);
        }

        if (request.getVisibility() != null) {
            String visibility = request.getVisibility().toUpperCase();
            if (!VALID_VISIBILITY.contains(visibility)) {
                throw new InvalidProjectStateException("Invalid visibility: " + visibility);
            }
            project.setVisibility(visibility);
        }

        project.setUpdatedAt(Instant.now());
        Project saved = projectRepository.save(project);
        return toProjectResponse(saved);
    }

    // ── DELETE (soft) ───────────────────────
    @Transactional
    public void deleteProject(UUID userId, UUID projectId) {
        Project project = getActiveOrThrow(projectId);
        requireRole(projectId, userId, "LEADER");

        project.setIsDeleted(true);
        project.setDeletedAt(Instant.now());
        projectRepository.save(project);
        log.info("Project soft-deleted: {} by {}", projectId, userId);
    }

    // ── GET single ──────────────────────────
    @Transactional(readOnly = true)
    public ProjectResponse getProject(UUID projectId, UUID callerUserId) {
        Project project = getActiveOrThrow(projectId);
        requireViewAccess(project, callerUserId);
        return toProjectResponse(project);
    }

    // ── GET my projects ─────────────────────
    @Transactional(readOnly = true)
    public List<ProjectResponse> getMyProjects(UUID userId) {
        List<UUID> projectIds = projectMemberRepository.findByUserIdAndIsDeletedFalse(userId)
                .stream().map(ProjectMember::getProjectId).collect(Collectors.toList());

        return projectRepository.findAllById(projectIds).stream()
                .filter(p -> !p.getIsDeleted())
                .map(this::toProjectResponse)
                .collect(Collectors.toList());
    }

    // ── DISCOVER (browse other users' PUBLIC projects) ─────
    /**
     * NOTE — requires two things that don't exist yet in the files I was
     * given, flagged here rather than silently assumed:
     *
     *   1. ProjectRepository needs a new method:
     *        List<Project> findByVisibilityAndIsDeletedFalse(String visibility);
     *      There's currently no query for "all PUBLIC projects" — only
     *      findByIdAndIsDeletedFalse / findAllById, both id-scoped.
     *
     *   2. The Project entity has no projectType / requiredExperience /
     *      requiredRoles columns (confirmed against toProjectResponse()
     *      below, which only ever reads id, ownerUserId, name, description,
     *      githubRepoUrl, status, visibility, techStack, maxMembers,
     *      createdAt). Filtering by projectType/requiredExperience is a
     *      no-op until those columns (and a migration) exist. techStack
     *      filtering DOES work today — it's a real column, just a single
     *      comma-separated string (e.g. "React, TypeScript"), so it's
     *      matched with contains-any-of rather than an exact/array match.
     *
     * Self-projects (owner OR member) are excluded server-side — "discover"
     * showing your own projects back to you isn't discovery.
     */
    @Transactional(readOnly = true)
    public List<ProjectResponse> discoverProjects(
            UUID callerUserId,
            List<String> techStack,
            String projectType,
            String requiredExperience,
            String status) {

        Set<UUID> ownProjectIds = projectMemberRepository.findByUserIdAndIsDeletedFalse(callerUserId)
                .stream().map(ProjectMember::getProjectId).collect(Collectors.toSet());

        String normalizedStatus = status != null ? status.toUpperCase() : null;
        if (normalizedStatus != null && !VALID_STATUSES.contains(normalizedStatus)) {
            throw new InvalidProjectStateException("Invalid status: " + normalizedStatus);
        }

        return projectRepository.findByVisibilityAndIsDeletedFalse("PUBLIC").stream()
                .filter(p -> !ownProjectIds.contains(p.getId()) && !p.getOwnerUserId().equals(callerUserId))
                .filter(p -> normalizedStatus == null || normalizedStatus.equals(p.getStatus()))
                .filter(p -> matchesAnyTech(p, techStack))
                // projectType / requiredExperience have no backing column yet — see
                // the method comment above. Left as a pass-through no-op filter
                // (never excludes anything) rather than silently dropped, so it's
                // obvious in code review that these params aren't wired end-to-end.
                .filter(p -> projectType == null || true)
                .filter(p -> requiredExperience == null || true)
                .limit(DISCOVER_RESULT_CAP)
                .map(this::toProjectResponse)
                .collect(Collectors.toList());
    }

    private boolean matchesAnyTech(Project p, List<String> techStack) {
        if (techStack == null || techStack.isEmpty()) return true;
        if (!StringUtils.hasText(p.getTechStack())) return false;
        Set<String> projectTech = Arrays.stream(p.getTechStack().split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        return techStack.stream().map(String::toLowerCase).anyMatch(projectTech::contains);
    }

    // ── INVITE ───────────────────────────────
    @Transactional
    public ProjectInvitationResponseDto inviteMember(UUID inviterId, UUID projectId, InviteMemberRequest request) {
        getActiveOrThrow(projectId);
        requireRole(projectId, inviterId, "LEADER");

        if (projectMemberRepository.existsByProjectIdAndUserIdAndIsDeletedFalse(projectId, request.getInvitedUserId())) {
            throw new InvalidProjectStateException("User is already a member of this project");
        }
        if (projectInvitationRepository.existsByProjectIdAndInvitedUserIdAndStatusAndIsDeletedFalse(
                projectId, request.getInvitedUserId(), "PENDING")) {
            throw new InvalidProjectStateException("User already has a pending invitation");
        }

        String role = request.getRole() != null ? request.getRole().toUpperCase() : "CONTRIBUTOR";
        validateRole(role);

        ProjectInvitation invitation = new ProjectInvitation();
        invitation.setProjectId(projectId);
        invitation.setInvitedUserId(request.getInvitedUserId());
        invitation.setInvitedByUserId(inviterId);
        invitation.setRole(role);
        invitation.setStatus("PENDING");
        invitation.setExpiresAt(Instant.now().plusSeconds(7L * 24 * 3600)); // 7 days
        invitation.setIsDeleted(false);

        ProjectInvitation saved = projectInvitationRepository.save(invitation);
        eventProducer.publishInvitationSent(saved.getId(), projectId, request.getInvitedUserId());

        return toInvitationDto(saved);
    }

    // ── ACCEPT INVITATION ────────────────────
    @Transactional
    public ProjectMemberResponseDto acceptInvitation(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = getInvitationOrThrow(invitationId);

        if (!invitation.getInvitedUserId().equals(userId)) {
            throw new UnauthorizedProjectActionException("This invitation does not belong to you");
        }
        if (!"PENDING".equals(invitation.getStatus())) {
            throw new InvalidProjectStateException("Only pending invitations can be accepted");
        }
        if (invitation.getExpiresAt() != null && invitation.getExpiresAt().isBefore(Instant.now())) {
            invitation.setStatus("EXPIRED");
            projectInvitationRepository.save(invitation);
            throw new InvalidProjectStateException("This invitation has expired");
        }

        Project project = getActiveOrThrow(invitation.getProjectId());
        long currentMembers = projectMemberRepository.countByProjectIdAndIsDeletedFalse(project.getId());
        if (project.getMaxMembers() != null && currentMembers >= project.getMaxMembers()) {
            throw new ProjectFullException("Project has reached its member limit");
        }

        invitation.setStatus("ACCEPTED");
        invitation.setRespondedAt(Instant.now());
        projectInvitationRepository.save(invitation);

        ProjectMember member = new ProjectMember();
        member.setProjectId(invitation.getProjectId());
        member.setUserId(userId);
        member.setRole(invitation.getRole());
        member.setJoinedAt(Instant.now());
        member.setInvitedByUserId(invitation.getInvitedByUserId());
        member.setIsDeleted(false);

        ProjectMember saved = projectMemberRepository.save(member);
        eventProducer.publishMemberJoined(invitation.getProjectId(), userId);

        return toMemberDto(saved);
    }

    // ── REJECT INVITATION ────────────────────
    @Transactional
    public ProjectInvitationResponseDto rejectInvitation(UUID userId, UUID invitationId) {
        ProjectInvitation invitation = getInvitationOrThrow(invitationId);

        if (!invitation.getInvitedUserId().equals(userId)) {
            throw new UnauthorizedProjectActionException("This invitation does not belong to you");
        }
        if (!"PENDING".equals(invitation.getStatus())) {
            throw new InvalidProjectStateException("Only pending invitations can be rejected");
        }

        invitation.setStatus("REJECTED");
        invitation.setRespondedAt(Instant.now());
        return toInvitationDto(projectInvitationRepository.save(invitation));
    }

    // ── REMOVE MEMBER / LEAVE ────────────────
    @Transactional
    public void removeMember(UUID actingUserId, UUID projectId, UUID targetUserId) {
        ProjectMember target = getMemberOrThrow(projectId, targetUserId);

        boolean isSelf = actingUserId.equals(targetUserId);
        if (!isSelf) {
            requireRole(projectId, actingUserId, "LEADER");
        }
        if ("LEADER".equals(target.getRole())) {
            throw new InvalidProjectStateException("Project leader cannot be removed; transfer leadership or delete the project");
        }

        target.setIsDeleted(true);
        target.setDeletedAt(Instant.now());
        projectMemberRepository.save(target);
        eventProducer.publishMemberRemoved(projectId, targetUserId);
    }

    // ── CHANGE ROLE ───────────────────────────
    @Transactional
    public ProjectMemberResponseDto changeRole(UUID actingUserId, UUID projectId, UUID targetUserId, String newRole) {
        requireRole(projectId, actingUserId, "LEADER");
        String role = newRole.toUpperCase();
        validateRole(role);

        ProjectMember target = getMemberOrThrow(projectId, targetUserId);
        target.setRole(role);
        target.setUpdatedAt(Instant.now());
        return toMemberDto(projectMemberRepository.save(target));
    }

    // ── LIST MEMBERS ──────────────────────────
    @Transactional(readOnly = true)
    public List<ProjectMemberResponseDto> getProjectMembers(UUID projectId, UUID callerUserId) {
        getActiveOrThrow(projectId);
        // Stricter than getProject: members list requires membership even on
        // a PUBLIC project — visibility controls the project card, not the roster.
        requireMembership(projectId, callerUserId);
        return projectMemberRepository.findByProjectIdAndIsDeletedFalse(projectId).stream()
                .map(this::toMemberDto)
                .collect(Collectors.toList());
    }

    // ── LIST MY PENDING INVITATIONS ───────────
    @Transactional(readOnly = true)
    public List<ProjectInvitationResponseDto> getPendingInvitations(UUID userId) {
        return projectInvitationRepository.findByInvitedUserIdAndStatusAndIsDeletedFalse(userId, "PENDING").stream()
                .map(this::toInvitationDto)
                .collect(Collectors.toList());
    }

    // ── JOIN REQUESTS (member-initiated; distinct from LEADER-initiated invitations) ──

    /**
     * Non-member requests to join a PUBLIC project. One active (PENDING)
     * request per user per project — mirrors the same uniqueness rule
     * inviteMember() already enforces for invitations.
     */
    @Transactional
    public ProjectJoinRequestResponseDto requestToJoin(UUID userId, UUID projectId) {
        Project project = getActiveOrThrow(projectId);

        if (!"PUBLIC".equals(project.getVisibility())) {
            throw new UnauthorizedProjectActionException("Cannot request to join a private project");
        }
        if (projectMemberRepository.existsByProjectIdAndUserIdAndIsDeletedFalse(projectId, userId)) {
            throw new InvalidProjectStateException("You are already a member of this project");
        }
        if (projectJoinRequestRepository.existsByProjectIdAndRequestingUserIdAndStatusAndIsDeletedFalse(
                projectId, userId, "PENDING")) {
            throw new InvalidProjectStateException("You already have a pending request for this project");
        }

        long currentMembers = projectMemberRepository.countByProjectIdAndIsDeletedFalse(projectId);
        if (project.getMaxMembers() != null && currentMembers >= project.getMaxMembers()) {
            throw new ProjectFullException("Project has reached its member limit");
        }

        ProjectJoinRequest joinRequest = new ProjectJoinRequest();
        joinRequest.setProjectId(projectId);
        joinRequest.setRequestingUserId(userId);
        joinRequest.setStatus("PENDING");
        joinRequest.setIsDeleted(false);

        ProjectJoinRequest saved = projectJoinRequestRepository.save(joinRequest);
        log.info("Join request created: project {} by user {}", projectId, userId);
        // NOTE: no eventProducer.publishJoinRequested(...) call — that method
        // doesn't exist on ProjectEventProducer in the files I have. Add one
        // there (mirroring publishInvitationSent) if the leader should get a
        // notification-service event when someone requests to join.

        return toJoinRequestDto(saved);
    }

    // ── LIST: pending join requests for a project (LEADER only) ─────
    @Transactional(readOnly = true)
    public List<ProjectJoinRequestResponseDto> getPendingJoinRequests(UUID leaderUserId, UUID projectId) {
        getActiveOrThrow(projectId);
        requireRole(projectId, leaderUserId, "LEADER");
        return projectJoinRequestRepository.findByProjectIdAndStatusAndIsDeletedFalse(projectId, "PENDING").stream()
                .map(this::toJoinRequestDto)
                .collect(Collectors.toList());
    }

    // ── LIST: current user's own join requests, any status, all projects ──
    @Transactional(readOnly = true)
    public List<ProjectJoinRequestResponseDto> getMyJoinRequests(UUID userId) {
        return projectJoinRequestRepository.findByRequestingUserIdAndIsDeletedFalse(userId).stream()
                .map(this::toJoinRequestDto)
                .collect(Collectors.toList());
    }

    // ── ACCEPT join request (LEADER only) ────────────────────────────
    @Transactional
    public ProjectMemberResponseDto acceptJoinRequest(UUID leaderUserId, UUID joinRequestId) {
        ProjectJoinRequest joinRequest = getJoinRequestOrThrow(joinRequestId);
        Project project = getActiveOrThrow(joinRequest.getProjectId());

        requireRole(project.getId(), leaderUserId, "LEADER");

        if (!"PENDING".equals(joinRequest.getStatus())) {
            throw new InvalidProjectStateException(
                    "Only pending join requests can be accepted"
            );
        }

        UUID requestingUserId = joinRequest.getRequestingUserId();

        // Prevent duplicate membership
        Optional<ProjectMember> existingMember =
                projectMemberRepository
                        .findByProjectIdAndUserIdAndIsDeletedFalse(
                                project.getId(),
                                requestingUserId
                        );

        if (existingMember.isPresent()) {
            throw new InvalidProjectStateException(
                    "User is already a member of this project"
            );
        }

        long currentMembers =
                projectMemberRepository.countByProjectIdAndIsDeletedFalse(
                        project.getId()
                );

        if (project.getMaxMembers() != null
                && currentMembers >= project.getMaxMembers()) {
            throw new ProjectFullException(
                    "Project has reached its member limit"
            );
        }

        ProjectMember member = new ProjectMember();
        member.setProjectId(project.getId());
        member.setUserId(requestingUserId);
        member.setRole("CONTRIBUTOR");
        member.setJoinedAt(Instant.now());
        member.setInvitedByUserId(leaderUserId);
        member.setIsDeleted(false);

        ProjectMember saved = projectMemberRepository.save(member);

        joinRequest.setStatus("ACCEPTED");
        joinRequest.setRespondedAt(Instant.now());
        projectJoinRequestRepository.save(joinRequest);

        eventProducer.publishMemberJoined(
                project.getId(),
                requestingUserId
        );

        return toMemberDto(saved);
    }

    // ── REJECT join request (LEADER only) ────────────────────────────
    @Transactional
    public ProjectJoinRequestResponseDto rejectJoinRequest(UUID leaderUserId, UUID joinRequestId) {
        ProjectJoinRequest joinRequest = getJoinRequestOrThrow(joinRequestId);
        requireRole(joinRequest.getProjectId(), leaderUserId, "LEADER");

        if (!"PENDING".equals(joinRequest.getStatus())) {
            throw new InvalidProjectStateException("Only pending join requests can be rejected");
        }

        joinRequest.setStatus("REJECTED");
        joinRequest.setRespondedAt(Instant.now());
        return toJoinRequestDto(projectJoinRequestRepository.save(joinRequest));
    }

    // ── CANCEL join request (the requester withdrawing their own request) ──
    @Transactional
    public ProjectJoinRequestResponseDto cancelJoinRequest(UUID userId, UUID joinRequestId) {
        ProjectJoinRequest joinRequest = getJoinRequestOrThrow(joinRequestId);

        if (!joinRequest.getRequestingUserId().equals(userId)) {
            throw new UnauthorizedProjectActionException("This join request does not belong to you");
        }
        if (!"PENDING".equals(joinRequest.getStatus())) {
            throw new InvalidProjectStateException("Only pending join requests can be cancelled");
        }

        joinRequest.setStatus("CANCELLED");
        joinRequest.setRespondedAt(Instant.now());
        return toJoinRequestDto(projectJoinRequestRepository.save(joinRequest));
    }

    private ProjectJoinRequest getJoinRequestOrThrow(UUID joinRequestId) {
        return projectJoinRequestRepository.findByIdAndIsDeletedFalse(joinRequestId)
                .orElseThrow(() -> new JoinRequestNotFoundException("Join request not found: " + joinRequestId));
    }

    private ProjectJoinRequestResponseDto toJoinRequestDto(ProjectJoinRequest jr) {
        return ProjectJoinRequestResponseDto.builder()
                .id(jr.getId())
                .projectId(jr.getProjectId())
                .requestingUserId(jr.getRequestingUserId())
                .status(jr.getStatus())
                .respondedAt(jr.getRespondedAt())
                .createdAt(jr.getCreatedAt())
                .build();
    }

    // ── MEMBERSHIP CHECK (for messaging-service) ──
    /**
     * View-access rule for GET /api/projects/{id} (single-project reads):
     *   PUBLIC projects  — any authenticated caller can view.
     *   PRIVATE projects — caller must be an active member (any role).
     * Sub-resources (members, and — once those controllers exist — tasks,
     * comments, resources) are stricter than this; see requireMembership.
     */
    private void requireViewAccess(Project project, UUID callerUserId) {
        if ("PRIVATE".equals(project.getVisibility())
                && !projectMemberRepository.existsByProjectIdAndUserIdAndIsDeletedFalse(project.getId(), callerUserId)) {
            throw new UnauthorizedProjectActionException("This project is private");
        }
    }

    /**
     * Member-only regardless of visibility — a PUBLIC project's roster,
     * task board, comments and resources aren't public just because the
     * project card is. Apply this same check in task-service /
     * comment-service / resource-service's equivalent read endpoints;
     * those controllers weren't in the files I was given so I couldn't
     * patch them directly.
     */
    private void requireMembership(UUID projectId, UUID callerUserId) {
        if (!projectMemberRepository.existsByProjectIdAndUserIdAndIsDeletedFalse(projectId, callerUserId)) {
            throw new UnauthorizedProjectActionException("You must be a member of this project to view this");
        }
    }
    @Transactional(readOnly = true)
    public MembershipCheckResponse checkMembership(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserIdAndIsDeletedFalse(projectId, userId)
                .map(m -> new MembershipCheckResponse(true, m.getRole()))
                .orElse(new MembershipCheckResponse(false, null));
    }

    // ── INTERNAL HELPERS ───────────────────────
    Project getActiveOrThrow(UUID projectId) {
        return projectRepository.findByIdAndIsDeletedFalse(projectId)
                .orElseThrow(() -> new ProjectNotFoundException("Project not found: " + projectId));
    }

    ProjectMember getMemberOrThrow(UUID projectId, UUID userId) {
        return projectMemberRepository.findByProjectIdAndUserIdAndIsDeletedFalse(projectId, userId)
                .orElseThrow(() -> new MemberNotFoundException("User " + userId + " is not a member of project " + projectId));
    }

    private ProjectInvitation getInvitationOrThrow(UUID invitationId) {
        return projectInvitationRepository.findByIdAndIsDeletedFalse(invitationId)
                .orElseThrow(() -> new InvitationNotFoundException("Invitation not found: " + invitationId));
    }

    void requireRole(UUID projectId, UUID userId, String requiredRole) {
        ProjectMember member = getMemberOrThrow(projectId, userId);
        if (!requiredRole.equals(member.getRole())) {
            throw new UnauthorizedProjectActionException("Action requires role: " + requiredRole);
        }
    }

    private void validateRole(String role) {
        if (!VALID_ROLES.contains(role)) {
            throw new InvalidProjectStateException("Invalid role: " + role);
        }
    }

    private ProjectResponse toProjectResponse(Project p) {
        long memberCount = projectMemberRepository.countByProjectIdAndIsDeletedFalse(p.getId());
        return ProjectResponse.builder()
                .id(p.getId())
                .ownerUserId(p.getOwnerUserId())
                .name(p.getName())
                .description(p.getDescription())
                .githubRepoUrl(p.getGithubRepoUrl())
                .status(p.getStatus())
                .visibility(p.getVisibility())
                .techStack(p.getTechStack())
                .maxMembers(p.getMaxMembers())
                .memberCount(memberCount)
                .createdAt(p.getCreatedAt())
                .build();
    }

    private ProjectMemberResponseDto toMemberDto(ProjectMember m) {
        return ProjectMemberResponseDto.builder()
                .id(m.getId())
                .projectId(m.getProjectId())
                .userId(m.getUserId())
                .role(m.getRole())
                .joinedAt(m.getJoinedAt())
                .invitedByUserId(m.getInvitedByUserId())
                .build();
    }

    private ProjectInvitationResponseDto toInvitationDto(ProjectInvitation i) {
        return ProjectInvitationResponseDto.builder()
                .id(i.getId())
                .projectId(i.getProjectId())
                .invitedUserId(i.getInvitedUserId())
                .invitedByUserId(i.getInvitedByUserId())
                .role(i.getRole())
                .status(i.getStatus())
                .expiresAt(i.getExpiresAt())
                .respondedAt(i.getRespondedAt())
                .createdAt(i.getCreatedAt())
                .build();
    }
}