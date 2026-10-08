package com.codemates.project.repository;

import com.codemates.project.model.ProjectHealth;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ProjectHealthRepository extends JpaRepository<ProjectHealth, UUID> {
    Optional<ProjectHealth> findByProjectId(UUID projectId);
}
