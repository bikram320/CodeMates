package com.codemates.userprofile.repository;

import com.codemates.userprofile.model.Interest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface InterestRepository extends JpaRepository<Interest, UUID> {

    boolean existsByProfileIdAndInterestNameAndIsDeletedFalse(UUID profileId, String interestName);

    List<Interest> findByProfileIdAndIsDeletedFalse(UUID profileId);

    // ── added for discovery-service search ──────────────
    List<Interest> findByInterestNameInAndIsDeletedFalse(List<String> interestNames);
}
