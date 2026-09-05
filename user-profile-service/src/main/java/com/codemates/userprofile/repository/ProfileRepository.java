package com.codemates.userprofile.repository;

import com.codemates.userprofile.model.Profile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProfileRepository extends JpaRepository<Profile, UUID> {

    boolean existsByUserIdAndIsDeletedFalse(UUID userId);

    Optional<Profile> findByUserIdAndIsDeletedFalse(UUID userId);

    Optional<Profile> findByUsernameAndIsDeletedFalse(String username);

    boolean existsByUsernameAndIsDeletedFalse(String username);

    // ── added for discovery-service search ──────────────
    List<Profile> findByIsDeletedFalse();

    List<Profile> findByExperienceLevelAndIsDeletedFalse(String experienceLevel);

    List<Profile> findByIsOpenToCollaborateAndIsDeletedFalse(Boolean isOpenToCollaborate);

    List<Profile> findByExperienceLevelAndIsOpenToCollaborateAndIsDeletedFalse(
            String experienceLevel, Boolean isOpenToCollaborate);
}
