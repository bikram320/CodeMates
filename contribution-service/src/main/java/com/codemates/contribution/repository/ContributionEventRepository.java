package com.codemates.contribution.repository;

import com.codemates.contribution.model.ContributionEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ContributionEventRepository extends JpaRepository<ContributionEvent, UUID> {

    List<ContributionEvent> findByUserIdAndProjectIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID userId, UUID projectId);

    boolean existsByReferenceIdAndEventTypeAndIsDeletedFalse(UUID referenceId, String eventType);

    @Query("""
            SELECT COUNT(e) FROM ContributionEvent e
            WHERE e.userId = :userId AND e.projectId = :projectId
              AND e.eventType = :eventType AND e.isDeleted = false
              AND e.createdAt >= :since
            """)
    long countByUserIdAndProjectIdAndEventTypeSince(
            @Param("userId") UUID userId,
            @Param("projectId") UUID projectId,
            @Param("eventType") String eventType,
            @Param("since") Instant since);
}
