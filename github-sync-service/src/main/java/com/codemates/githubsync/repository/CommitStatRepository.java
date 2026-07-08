package com.codemates.githubsync.repository;

import com.codemates.githubsync.model.CommitStat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface CommitStatRepository extends JpaRepository<CommitStat, UUID> {
    Optional<CommitStat> findByRepositoryIdAndIsDeletedFalse(UUID repositoryId);
}