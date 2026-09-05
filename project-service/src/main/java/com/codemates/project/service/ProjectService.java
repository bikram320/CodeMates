package com.codemates.project.service;

import com.codemates.project.dto.*;
import com.codemates.project.event.ProjectEventProducer;
import com.codemates.project.exception.*;
import com.codemates.project.model.Project;
import com.codemates.project.model.ProjectInvitation;
import com.codemates.project.model.ProjectMember;
import com.codemates.project.repository.ProjectInvitationRepository;
import com.codemates.project.repository.ProjectMemberRepository;
import com.codemates.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProjectService {

    private static final List<String> VALID_ROLES = List.of("LEADER", "CONTRIBUTOR", "REVIEWER");
    private static final List<String> VALID_STATUSES = List.of("ACTIVE", "COMPLETED", "ARCHIVED");
    private static final List<String> VALID_VISIBILITY = List.of("PUBLIC", "PRIVATE");

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
    public ProjectResponse getProject(UUID projectId) {
        return toProjectResponse(getActiveOrThrow(projectId));
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
    public List<ProjectMemberResponseDto> getProjectMembers(UUID projectId) {
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
