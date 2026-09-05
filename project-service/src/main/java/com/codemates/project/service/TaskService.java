package com.codemates.project.service;

import com.codemates.project.dto.*;
import com.codemates.project.event.TaskEventProducer;
import com.codemates.project.exception.*;
import com.codemates.project.model.Task;
import com.codemates.project.repository.ProjectMemberRepository;
import com.codemates.project.repository.TaskRepository;
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
public class TaskService {

    private static final List<String> VALID_STATUSES = List.of("TODO", "IN_PROGRESS", "REVIEW", "DONE");
    private static final List<String> VALID_PRIORITIES = List.of("LOW", "MEDIUM", "HIGH", "URGENT");

    private final TaskRepository taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectService projectService; // reused for membership/role checks (same package)
    private final TaskEventProducer eventProducer;

    // ── CREATE (LEADER only) ──────────────────
    @Transactional
    public TaskResponse createTask(UUID userId, UUID projectId, CreateTaskRequest request) {
        projectService.getActiveOrThrow(projectId);
        projectService.requireRole(projectId, userId, "LEADER");

        if (request.getAssignedToUserId() != null) {
            validateAssignee(projectId, request.getAssignedToUserId());
        }

        String priority = request.getPriority() != null ? request.getPriority().toUpperCase() : "MEDIUM";
        validatePriority(priority);

        Task task = new Task();
        task.setProjectId(projectId);
        task.setCreatedByUserId(userId);
        task.setAssignedToUserId(request.getAssignedToUserId());
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setStatus("TODO");
        task.setPriority(priority);
        task.setDueDate(request.getDueDate());
        task.setPosition(request.getPosition() != null ? request.getPosition() : 0);
        task.setIsDeleted(false);

        Task saved = taskRepository.save(task);

        eventProducer.publishTaskCreated(saved.getId(), projectId, userId);
        if (saved.getAssignedToUserId() != null) {
            eventProducer.publishTaskAssigned(saved.getId(), projectId, saved.getAssignedToUserId());
        }

        log.info("Task created: {} in project {} by {}", saved.getId(), projectId, userId);
        return toTaskResponse(saved);
    }

    // ── UPDATE core fields (LEADER only) ──────
    @Transactional
    public TaskResponse updateTask(UUID userId, UUID projectId, UUID taskId, UpdateTaskRequest request) {
        Task task = getTaskOrThrow(projectId, taskId);
        projectService.requireRole(projectId, userId, "LEADER");

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());

        if (request.getPriority() != null) {
            String priority = request.getPriority().toUpperCase();
            validatePriority(priority);
            task.setPriority(priority);
        }

        if (request.getAssignedToUserId() != null &&
                !request.getAssignedToUserId().equals(task.getAssignedToUserId())) {
            validateAssignee(projectId, request.getAssignedToUserId());
            task.setAssignedToUserId(request.getAssignedToUserId());
            eventProducer.publishTaskAssigned(taskId, projectId, request.getAssignedToUserId());
        }

        task.setUpdatedAt(Instant.now());
        Task saved = taskRepository.save(task);
        return toTaskResponse(saved);
    }

    // ── CHANGE STATUS / MOVE ON BOARD (assignee or LEADER) ──
    @Transactional
    public TaskResponse changeStatus(UUID userId, UUID projectId, UUID taskId, ChangeTaskStatusRequest request) {
        Task task = getTaskOrThrow(projectId, taskId);
        requireAssigneeOrLeader(projectId, userId, task);

        String newStatus = request.getStatus().toUpperCase();
        if (!VALID_STATUSES.contains(newStatus)) {
            throw new InvalidTaskStateException("Invalid status: " + newStatus);
        }

        String oldStatus = task.getStatus();
        task.setStatus(newStatus);

        if (request.getPosition() != null) {
            task.setPosition(request.getPosition());
        }

        if ("DONE".equals(newStatus) && !"DONE".equals(oldStatus)) {
            task.setCompletedAt(Instant.now());
        } else if (!"DONE".equals(newStatus)) {
            task.setCompletedAt(null);
        }

        task.setUpdatedAt(Instant.now());
        Task saved = taskRepository.save(task);

        if (!oldStatus.equals(newStatus)) {
            eventProducer.publishTaskStatusChanged(taskId, projectId, oldStatus, newStatus);
            if ("DONE".equals(newStatus)) {
                eventProducer.publishTaskCompleted(taskId, projectId, userId);
            }
        }

        return toTaskResponse(saved);
    }

    // ── DELETE (LEADER only, soft) ─────────────
    @Transactional
    public void deleteTask(UUID userId, UUID projectId, UUID taskId) {
        Task task = getTaskOrThrow(projectId, taskId);
        projectService.requireRole(projectId, userId, "LEADER");

        task.setIsDeleted(true);
        task.setDeletedAt(Instant.now());
        taskRepository.save(task);
        log.info("Task soft-deleted: {} by {}", taskId, userId);
    }

    // ── GET single ─────────────────────────────
    @Transactional(readOnly = true)
    public TaskResponse getTask(UUID projectId, UUID taskId) {
        return toTaskResponse(getTaskOrThrow(projectId, taskId));
    }

    // ── LIST project tasks (all, or by status column) ──
    @Transactional(readOnly = true)
    public List<TaskResponse> getProjectTasks(UUID projectId, String status) {
        List<Task> tasks = (status != null)
                ? taskRepository.findByProjectIdAndStatusAndIsDeletedFalse(projectId, status.toUpperCase())
                : taskRepository.findByProjectIdAndIsDeletedFalse(projectId);

        return tasks.stream().map(this::toTaskResponse).collect(Collectors.toList());
    }

    // ── LIST tasks assigned to a user (across projects) ──
    @Transactional(readOnly = true)
    public List<TaskResponse> getMyTasks(UUID userId) {
        return taskRepository.findByAssignedToUserIdAndIsDeletedFalse(userId).stream()
                .map(this::toTaskResponse)
                .collect(Collectors.toList());
    }

    // ── INTERNAL HELPERS ────────────────────────
    Task getTaskOrThrow(UUID projectId, UUID taskId) {
        Task task = taskRepository.findByIdAndIsDeletedFalse(taskId)
                .orElseThrow(() -> new TaskNotFoundException("Task not found: " + taskId));
        if (!task.getProjectId().equals(projectId)) {
            throw new TaskNotFoundException("Task " + taskId + " does not belong to project " + projectId);
        }
        return task;
    }

    private void validateAssignee(UUID projectId, UUID assigneeUserId) {
        boolean isMember = projectMemberRepository
                .existsByProjectIdAndUserIdAndIsDeletedFalse(projectId, assigneeUserId);
        if (!isMember) {
            throw new InvalidTaskStateException("Assignee must be an existing member of this project");
        }
    }

    private void requireAssigneeOrLeader(UUID projectId, UUID userId, Task task) {
        boolean isAssignee = userId.equals(task.getAssignedToUserId());
        if (isAssignee) return;

        // will throw UnauthorizedProjectActionException if not LEADER
        projectService.requireRole(projectId, userId, "LEADER");
    }

    private void validatePriority(String priority) {
        if (!VALID_PRIORITIES.contains(priority)) {
            throw new InvalidTaskStateException("Invalid priority: " + priority);
        }
    }

    private TaskResponse toTaskResponse(Task t) {
        return TaskResponse.builder()
                .id(t.getId())
                .projectId(t.getProjectId())
                .createdByUserId(t.getCreatedByUserId())
                .assignedToUserId(t.getAssignedToUserId())
                .title(t.getTitle())
                .description(t.getDescription())
                .status(t.getStatus())
                .priority(t.getPriority())
                .dueDate(t.getDueDate())
                .completedAt(t.getCompletedAt())
                .position(t.getPosition())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
