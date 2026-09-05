package com.codemates.project.controller;

import com.codemates.project.dto.*;
import com.codemates.project.security.JwtCookieExtractor;
import com.codemates.project.service.TaskCommentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class TaskCommentController {

    private final TaskCommentService taskCommentService;
    private final JwtCookieExtractor jwtCookieExtractor;

    @PostMapping
    public ResponseEntity<ApiResponse<TaskCommentResponse>> add(
            HttpServletRequest request, @PathVariable UUID projectId, @PathVariable UUID taskId,
            @Valid @RequestBody CreateTaskCommentRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Comment added",
                        taskCommentService.addComment(userId, projectId, taskId, dto)));
    }

    @PutMapping("/{commentId}")
    public ApiResponse<TaskCommentResponse> update(
            HttpServletRequest request, @PathVariable UUID projectId, @PathVariable UUID taskId,
            @PathVariable UUID commentId, @Valid @RequestBody UpdateTaskCommentRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Comment updated",
                taskCommentService.updateComment(userId, commentId, dto));
    }

    @DeleteMapping("/{commentId}")
    public ApiResponse<Void> delete(
            HttpServletRequest request, @PathVariable UUID projectId, @PathVariable UUID taskId,
            @PathVariable UUID commentId) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        taskCommentService.deleteComment(userId, projectId, commentId);
        return ApiResponse.success("Comment deleted", null);
    }

    @GetMapping
    public ApiResponse<List<TaskCommentResponse>> list(
            @PathVariable UUID projectId, @PathVariable UUID taskId) {
        return ApiResponse.success("Comments fetched", taskCommentService.getTaskComments(projectId, taskId));
    }
}
