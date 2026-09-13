package com.codemates.contribution.repository;

import com.codemates.contribution.model.ProjectRepositoryLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepositoryLinkRepository extends JpaRepository<ProjectRepositoryLink, UUID> {

    List<ProjectRepositoryLink> findByUserIdAndIsDeletedFalse(UUID userId);

    List<ProjectRepositoryLink> findByProjectIdAndIsDeletedFalse(UUID projectId);

    Optional<ProjectRepositoryLink> findByProjectIdAndRepositoryIdAndIsDeletedFalse(UUID projectId, UUID repositoryId);

    boolean existsByProjectIdAndRepositoryIdAndIsDeletedFalse(UUID projectId, UUID repositoryId);
}
