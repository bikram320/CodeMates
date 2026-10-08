package com.codemates.project.service;

import com.codemates.project.dto.CreateResourceRequest;
import com.codemates.project.dto.ResourceResponse;
import com.codemates.project.exception.ResourceNotFoundException;
import com.codemates.project.model.ProjectResource;
import com.codemates.project.repository.ProjectResourceRepository;
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
public class ProjectResourceService {

    private static final List<String> VALID_TYPES = List.of("LINK", "DOCUMENT", "DESIGN", "OTHER");

    private final ProjectResourceRepository resourceRepository;
    private final ProjectService projectService;

    @Transactional
    public ResourceResponse addResource(UUID userId, UUID projectId, CreateResourceRequest request) {
        projectService.getActiveOrThrow(projectId);
        projectService.getMemberOrThrow(projectId, userId);

        String type = request.getResourceType() != null ? request.getResourceType().toUpperCase() : "LINK";
        if (!VALID_TYPES.contains(type)) {
            throw new IllegalArgumentException("Invalid resourceType: " + type);
        }

        ProjectResource resource = ProjectResource.builder()
                .projectId(projectId)
                .uploadedByUserId(userId)
                .name(request.getName())
                .url(request.getUrl())
                .description(request.getDescription())
                .resourceType(type)
                .isDeleted(false)
                .build();

        ProjectResource saved = resourceRepository.save(resource);
        log.info("Resource '{}' added to project {} by {}", saved.getName(), projectId, userId);
        return toDto(saved);
    }

    @Transactional
    public void deleteResource(UUID userId, UUID projectId, UUID resourceId) {
        ProjectResource resource = getActiveOrThrow(resourceId);

        boolean isUploader = resource.getUploadedByUserId().equals(userId);
        if (!isUploader) {
            projectService.requireRole(projectId, userId, "LEADER");
        }

        resource.setIsDeleted(true);
        resource.setDeletedAt(Instant.now());
        resourceRepository.save(resource);
    }

    @Transactional(readOnly = true)
    public List<ResourceResponse> getProjectResources(UUID projectId) {
        return resourceRepository.findByProjectIdAndIsDeletedFalseOrderByCreatedAtDesc(projectId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private ProjectResource getActiveOrThrow(UUID resourceId) {
        return resourceRepository.findByIdAndIsDeletedFalse(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found: " + resourceId));
    }

    private ResourceResponse toDto(ProjectResource r) {
        return ResourceResponse.builder()
                .id(r.getId())
                .projectId(r.getProjectId())
                .uploadedByUserId(r.getUploadedByUserId())
                .name(r.getName())
                .url(r.getUrl())
                .description(r.getDescription())
                .resourceType(r.getResourceType())
                .createdAt(r.getCreatedAt())
                .build();
    }
}