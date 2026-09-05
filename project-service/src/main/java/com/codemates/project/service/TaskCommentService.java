package com.codemates.project.service;

import com.codemates.project.dto.CreateTaskCommentRequest;
import com.codemates.project.dto.TaskCommentResponse;
import com.codemates.project.dto.UpdateTaskCommentRequest;
import com.codemates.project.event.TaskEventProducer;
import com.codemates.project.exception.TaskCommentNotFoundException;
import com.codemates.project.exception.UnauthorizedTaskActionException;
import com.codemates.project.model.Task;
import com.codemates.project.model.TaskComment;
import com.codemates.project.repository.TaskCommentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskCommentService {

    private final TaskCommentRepository taskCommentRepository;
    private final TaskService taskService;         // reused for task lookup + project membership context
    private final ProjectService projectService;   // reused for membership check (any role can comment)
    private final TaskEventProducer eventProducer;

    // ── ADD COMMENT (any accepted project member) ──
    @Transactional
    public TaskCommentResponse addComment(UUID userId, UUID projectId, UUID taskId, CreateTaskCommentRequest request) {
        Task task = taskService.getTaskOrThrow(projectId, taskId);
        projectService.getMemberOrThrow(projectId, userId); // throws if not a member

        TaskComment comment = new TaskComment();
        comment.setTaskId(task.getId());
        comment.setAuthorUserId(userId);
        comment.setContent(request.getContent());
        comment.setIsEdited(false);
        comment.setIsDeleted(false);

        TaskComment saved = taskCommentRepository.save(comment);
        eventProducer.publishCommentAdded(saved.getId(), taskId, userId);

        return toDto(saved);
    }

    // ── EDIT COMMENT (author only) ──────────────
    @Transactional
    public TaskCommentResponse updateComment(UUID userId, UUID commentId, UpdateTaskCommentRequest request) {
        TaskComment comment = getCommentOrThrow(commentId);

        if (!comment.getAuthorUserId().equals(userId)) {
            throw new UnauthorizedTaskActionException("Only the comment author can edit this comment");
        }

        comment.setContent(request.getContent());
        comment.setIsEdited(true);
        comment.setEditedAt(Instant.now());
        comment.setUpdatedAt(Instant.now());

        return toDto(taskCommentRepository.save(comment));
    }

    // ── DELETE COMMENT (author or project LEADER) ──
    @Transactional
    public void deleteComment(UUID userId, UUID projectId, UUID commentId) {
        TaskComment comment = getCommentOrThrow(commentId);

        boolean isAuthor = comment.getAuthorUserId().equals(userId);
        if (!isAuthor) {
            projectService.requireRole(projectId, userId, "LEADER");
        }

        comment.setIsDeleted(true);
        comment.setDeletedAt(Instant.now());
        taskCommentRepository.save(comment);
    }

    // ── LIST comments for a task ─────────────────
    @Transactional(readOnly = true)
    public List<TaskCommentResponse> getTaskComments(UUID projectId, UUID taskId) {
        taskService.getTaskOrThrow(projectId, taskId); // validates task belongs to project
        return taskCommentRepository.findByTaskIdAndIsDeletedFalseOrderByCreatedAtAsc(taskId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ── INTERNAL HELPERS ──────────────────────────
    private TaskComment getCommentOrThrow(UUID commentId) {
        return taskCommentRepository.findByIdAndIsDeletedFalse(commentId)
                .orElseThrow(() -> new TaskCommentNotFoundException("Comment not found: " + commentId));
    }

    private TaskCommentResponse toDto(TaskComment c) {
        return TaskCommentResponse.builder()
                .id(c.getId())
                .taskId(c.getTaskId())
                .authorUserId(c.getAuthorUserId())
                .content(c.getContent())
                .isEdited(c.getIsEdited())
                .editedAt(c.getEditedAt())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
