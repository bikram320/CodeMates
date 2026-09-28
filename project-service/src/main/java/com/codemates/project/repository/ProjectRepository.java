package com.codemates.project.repository;

import com.codemates.project.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {
    Optional<Project> findByIdAndIsDeletedFalse(UUID id);
    List<Project> findByOwnerUserIdAndIsDeletedFalse(UUID ownerUserId);

    List<Project> findByStatusAndIsDeletedFalse(String status);
    List<Project> findByVisibilityAndIsDeletedFalse(String visibility);
}
