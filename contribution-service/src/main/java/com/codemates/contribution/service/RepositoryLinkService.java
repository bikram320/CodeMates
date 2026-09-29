package com.codemates.contribution.service;

import com.codemates.contribution.dto.RepositoryLinkResponse;
import com.codemates.contribution.exception.DuplicateRepositoryLinkException;
import com.codemates.contribution.exception.RepositoryLinkNotFoundException;
import com.codemates.contribution.model.ProjectRepositoryLink;
import com.codemates.contribution.repository.ProjectRepositoryLinkRepository;
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
public class RepositoryLinkService {

    private final ProjectRepositoryLinkRepository repoLinkRepository;

    @Transactional
    public RepositoryLinkResponse linkRepository(UUID userId, UUID projectId, UUID repositoryId) {
        if (repoLinkRepository.existsByProjectIdAndRepositoryIdAndIsDeletedFalse(projectId, repositoryId)) {
            throw new DuplicateRepositoryLinkException("Repository " + repositoryId + " is already linked to project " + projectId);
        }

        Instant now = Instant.now();
        ProjectRepositoryLink link = new ProjectRepositoryLink();
        link.setProjectId(projectId);
        link.setUserId(userId);
        link.setRepositoryId(repositoryId);
        link.setLastKnownTotalCommits(0);
        link.setIsDeleted(false);
        link.setCreatedAt(now);
        link.setUpdatedAt(now);

        ProjectRepositoryLink saved = repoLinkRepository.save(link);
        log.info("Linked repository {} to project {} for user {}", repositoryId, projectId, userId);
        return toResponse(saved);
    }

    @Transactional
    public void unlinkRepository(UUID projectId, UUID repositoryId) {
        ProjectRepositoryLink link = repoLinkRepository.findByProjectIdAndRepositoryIdAndIsDeletedFalse(projectId, repositoryId)
                .orElseThrow(() -> new RepositoryLinkNotFoundException(
                        "No link found between project " + projectId + " and repository " + repositoryId));

        link.setIsDeleted(true);
        link.setDeletedAt(Instant.now());
        repoLinkRepository.save(link);
    }

    @Transactional(readOnly = true)
    public List<RepositoryLinkResponse> getLinksForProject(UUID projectId) {
        return repoLinkRepository.findByProjectIdAndIsDeletedFalse(projectId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private RepositoryLinkResponse toResponse(ProjectRepositoryLink link) {
        return RepositoryLinkResponse.builder()
                .id(link.getId())
                .projectId(link.getProjectId())
                .userId(link.getUserId())
                .repositoryId(link.getRepositoryId())
                .lastKnownTotalCommits(link.getLastKnownTotalCommits())
                .build();
    }
}
