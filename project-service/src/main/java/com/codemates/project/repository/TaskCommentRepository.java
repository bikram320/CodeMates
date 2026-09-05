package com.codemates.project.repository;

import com.codemates.project.model.TaskComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TaskCommentRepository extends JpaRepository<TaskComment, UUID> {

    Optional<TaskComment> findByIdAndIsDeletedFalse(UUID id);

    List<TaskComment> findByTaskIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID taskId);
}
