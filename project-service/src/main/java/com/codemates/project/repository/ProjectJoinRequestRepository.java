package com.codemates.project.repository;

import com.codemates.project.model.ProjectJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectJoinRequestRepository extends JpaRepository<ProjectJoinRequest, UUID> {

    Optional<ProjectJoinRequest> findByIdAndIsDeletedFalse(UUID id);

    List<ProjectJoinRequest> findByProjectIdAndStatusAndIsDeletedFalse(UUID projectId, String status);

    List<ProjectJoinRequest> findByRequestingUserIdAndIsDeletedFalse(UUID requestingUserId);

    boolean existsByProjectIdAndRequestingUserIdAndStatusAndIsDeletedFalse(
            UUID projectId, UUID requestingUserId, String status);
}