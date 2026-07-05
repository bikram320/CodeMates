package com.codemates.userprofile.repository;

import com.codemates.userprofile.model.Interest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface InterestRepository extends JpaRepository<Interest, UUID> {

  List<Interest> findByProfileIdAndIsDeletedFalse(UUID profileId);

  Optional<Interest> findByProfileIdAndInterestNameAndIsDeletedFalse(
          UUID profileId, String interestName);

  boolean existsByProfileIdAndInterestNameAndIsDeletedFalse(
          UUID profileId, String interestName);

  @Modifying
  @Query("UPDATE Interest i SET i.isDeleted = true, i.deletedAt = CURRENT_TIMESTAMP WHERE i.profileId = :profileId")
  void softDeleteAllByProfileId(UUID profileId);
}