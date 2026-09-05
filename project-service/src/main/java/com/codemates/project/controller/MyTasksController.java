package com.codemates.project.controller;

import com.codemates.project.dto.ApiResponse;
import com.codemates.project.dto.TaskResponse;
import com.codemates.project.security.JwtCookieExtractor;
import com.codemates.project.service.TaskService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class MyTasksController {

    private final TaskService taskService;
    private final JwtCookieExtractor jwtCookieExtractor;

    // all tasks assigned to the current user, across every project
    @GetMapping("/my")
    public ApiResponse<List<TaskResponse>> myTasks(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Your tasks fetched", taskService.getMyTasks(userId));
    }
}
