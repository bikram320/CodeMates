package com.codemates.project.repository;

import com.codemates.project.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskRepository extends JpaRepository<Task, UUID> {

    Optional<Task> findByIdAndIsDeletedFalse(UUID id);

    List<Task> findByProjectIdAndIsDeletedFalse(UUID projectId);

    List<Task> findByProjectIdAndStatusAndIsDeletedFalse(UUID projectId, String status);

    List<Task> findByAssignedToUserIdAndIsDeletedFalse(UUID assignedToUserId);
}
