package com.codemates.userprofile.repository;

import com.codemates.userprofile.model.Skill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SkillRepository extends JpaRepository<Skill, UUID> {

    boolean existsByProfileIdAndSkillNameAndIsDeletedFalse(UUID profileId, String skillName);

    List<Skill> findByProfileIdAndIsDeletedFalse(UUID profileId);

    // ── added for discovery-service search ──────────────
    List<Skill> findBySkillNameInAndIsDeletedFalse(List<String> skillNames);
}
