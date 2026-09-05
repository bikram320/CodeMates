package com.codemates.project.repository;

import com.codemates.project.model.ProjectInvitation;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, UUID> {

    Optional<ProjectInvitation> findByIdAndIsDeletedFalse(UUID id);

    List<ProjectInvitation> findByInvitedUserIdAndStatusAndIsDeletedFalse(UUID invitedUserId, String status);

    List<ProjectInvitation> findByProjectIdAndIsDeletedFalse(UUID projectId);

    boolean existsByProjectIdAndInvitedUserIdAndStatusAndIsDeletedFalse(
            UUID projectId, UUID invitedUserId, String status);
}
