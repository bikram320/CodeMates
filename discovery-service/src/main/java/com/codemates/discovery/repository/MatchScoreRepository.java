package com.codemates.discovery.repository;

import com.codemates.discovery.model.MatchScore;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MatchScoreRepository extends JpaRepository<MatchScore, UUID> {

    Optional<MatchScore> findByUserIdAndMatchedUserIdAndIsDeletedFalse(UUID userId, UUID matchedUserId);

    List<MatchScore> findByUserIdAndIsDeletedFalseOrderByTotalMatchScoreDesc(UUID userId, Pageable pageable);
}
