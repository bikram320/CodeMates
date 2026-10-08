package com.codemates.project.controller;

import com.codemates.project.dto.ApiResponse;
import com.codemates.project.dto.CreateResourceRequest;
import com.codemates.project.dto.ResourceResponse;
import com.codemates.project.security.JwtCookieExtractor;
import com.codemates.project.service.ProjectResourceService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/projects/{projectId}/resources")
@RequiredArgsConstructor
public class ProjectResourceController {

    private final ProjectResourceService resourceService;
    private final JwtCookieExtractor jwtCookieExtractor;

    @PostMapping
    public ResponseEntity<ApiResponse<ResourceResponse>> add(
            HttpServletRequest request, @PathVariable UUID projectId,
            @Valid @RequestBody CreateResourceRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resource added", resourceService.addResource(userId, projectId, dto)));
    }

    @DeleteMapping("/{resourceId}")
    public ApiResponse<Void> delete(
            HttpServletRequest request, @PathVariable UUID projectId, @PathVariable UUID resourceId) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        resourceService.deleteResource(userId, projectId, resourceId);
        return ApiResponse.success("Resource deleted", null);
    }

    @GetMapping
    public ApiResponse<List<ResourceResponse>> list(@PathVariable UUID projectId) {
        return ApiResponse.success("Resources fetched", resourceService.getProjectResources(projectId));
    }
}