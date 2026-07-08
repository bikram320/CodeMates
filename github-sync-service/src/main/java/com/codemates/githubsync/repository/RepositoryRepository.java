package com.codemates.githubsync.repository;

import com.codemates.githubsync.model.Repository;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RepositoryRepository extends JpaRepository<Repository, UUID> {
    List<Repository> findByUserIdAndIsDeletedFalse(UUID userId);
    Optional<Repository> findByGithubProfileIdAndRepoFullNameAndIsDeletedFalse(UUID githubProfileId, String repoFullName);
    Optional<Repository> findByIdAndIsDeletedFalse(UUID id);
}