package com.codemates.project.repository;

import com.codemates.project.model.ProjectResource;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectResourceRepository extends JpaRepository<ProjectResource, UUID> {
    List<ProjectResource> findByProjectIdAndIsDeletedFalseOrderByCreatedAtDesc(UUID projectId);
    Optional<ProjectResource> findByIdAndIsDeletedFalse(UUID id);
}