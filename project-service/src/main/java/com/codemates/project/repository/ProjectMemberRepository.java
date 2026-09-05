package com.codemates.project.repository;

import com.codemates.project.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    Optional<ProjectMember> findByProjectIdAndUserIdAndIsDeletedFalse(UUID projectId, UUID userId);

    List<ProjectMember> findByProjectIdAndIsDeletedFalse(UUID projectId);

    List<ProjectMember> findByUserIdAndIsDeletedFalse(UUID userId);

    boolean existsByProjectIdAndUserIdAndIsDeletedFalse(UUID projectId, UUID userId);

    long countByProjectIdAndIsDeletedFalse(UUID projectId);
}
