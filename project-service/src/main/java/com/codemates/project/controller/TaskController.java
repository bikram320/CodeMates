package com.codemates.project.controller;

import com.codemates.project.dto.*;
import com.codemates.project.security.JwtCookieExtractor;
import com.codemates.project.service.TaskService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final JwtCookieExtractor jwtCookieExtractor;

    @PostMapping
    public ResponseEntity<ApiResponse<TaskResponse>> create(
            HttpServletRequest request, @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Task created", taskService.createTask(userId, projectId, dto)));
    }

    @PutMapping("/{taskId}")
    public ApiResponse<TaskResponse> update(
            HttpServletRequest request, @PathVariable UUID projectId, @PathVariable UUID taskId,
            @RequestBody UpdateTaskRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Task updated", taskService.updateTask(userId, projectId, taskId, dto));
    }

    @PutMapping("/{taskId}/status")
    public ApiResponse<TaskResponse> changeStatus(
            HttpServletRequest request, @PathVariable UUID projectId, @PathVariable UUID taskId,
            @Valid @RequestBody ChangeTaskStatusRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Task status updated", taskService.changeStatus(userId, projectId, taskId, dto));
    }

    @DeleteMapping("/{taskId}")
    public ApiResponse<Void> delete(
            HttpServletRequest request, @PathVariable UUID projectId, @PathVariable UUID taskId) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        taskService.deleteTask(userId, projectId, taskId);
        return ApiResponse.success("Task deleted", null);
    }

    @GetMapping("/{taskId}")
    public ApiResponse<TaskResponse> getById(@PathVariable UUID projectId, @PathVariable UUID taskId) {
        return ApiResponse.success("Task fetched", taskService.getTask(projectId, taskId));
    }

    @GetMapping
    public ApiResponse<List<TaskResponse>> list(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String status) {
        return ApiResponse.success("Tasks fetched", taskService.getProjectTasks(projectId, status));
    }
}
