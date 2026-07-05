package com.codemates.userprofile.repository;

import com.codemates.userprofile.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SkillRepository extends JpaRepository<Skill, UUID> {

  List<Skill> findByProfileIdAndIsDeletedFalse(UUID profileId);

  Optional<Skill> findByProfileIdAndSkillNameAndIsDeletedFalse(
          UUID profileId, String skillName);

  boolean existsByProfileIdAndSkillNameAndIsDeletedFalse(
          UUID profileId, String skillName);

  @Modifying
  @Query("UPDATE Skill s SET s.isDeleted = true, s.deletedAt = CURRENT_TIMESTAMP WHERE s.profileId = :profileId")
  void softDeleteAllByProfileId(UUID profileId);
}