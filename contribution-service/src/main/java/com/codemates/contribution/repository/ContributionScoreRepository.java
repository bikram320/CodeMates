package com.codemates.contribution.repository;

import com.codemates.contribution.model.ContributionScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContributionScoreRepository extends JpaRepository<ContributionScore, UUID> {

    Optional<ContributionScore> findByUserIdAndProjectIdAndIsDeletedFalse(UUID userId, UUID projectId);

    List<ContributionScore> findByProjectIdAndIsDeletedFalseOrderByTotalScoreDesc(UUID projectId);

    List<ContributionScore> findByUserIdAndIsDeletedFalse(UUID userId);
}
