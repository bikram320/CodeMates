package com.codemates.githubsync.repository;

import com.codemates.githubsync.model.GithubProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface GithubProfileRepository extends JpaRepository<GithubProfile, UUID> {
    Optional<GithubProfile> findByUserIdAndIsDeletedFalse(UUID userId);
}