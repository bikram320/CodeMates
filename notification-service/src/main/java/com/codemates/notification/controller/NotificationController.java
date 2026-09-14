package com.codemates.notification.controller;

import com.codemates.notification.dto.ApiResponse;
import com.codemates.notification.dto.NotificationPageResponse;
import com.codemates.notification.dto.NotificationResponse;
import com.codemates.notification.dto.UnreadCountResponse;
import com.codemates.notification.model.Notification;
import com.codemates.notification.security.JwtCookieExtractor;
import com.codemates.notification.service.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final JwtCookieExtractor jwtCookieExtractor;

    @GetMapping
    public ApiResponse<NotificationPageResponse> list(
            HttpServletRequest request,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant before,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "false") boolean unreadOnly) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        int cappedLimit = Math.min(Math.max(limit, 1), 100);
        NotificationPageResponse page = notificationService.getPage(userId, before, cappedLimit, unreadOnly);
        return ApiResponse.success("Notifications retrieved", page);
    }

    @GetMapping("/unread-count")
    public ApiResponse<UnreadCountResponse> unreadCount(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Unread count retrieved", new UnreadCountResponse(notificationService.getUnreadCount(userId)));
    }

    @PatchMapping("/{id}/read")
    public ApiResponse<NotificationResponse> markAsRead(HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        NotificationResponse updated = notificationService.markAsRead(id, userId);
        return ApiResponse.success("Notification marked as read", updated);
    }

    @PatchMapping("/read-all")
    public ApiResponse<Map<String, Integer>> markAllAsRead(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        int count = notificationService.markAllAsRead(userId);
        return ApiResponse.success("All notifications marked as read", Map.of("updatedCount", count));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        notificationService.delete(id, userId);
        return ApiResponse.success("Notification deleted", null);
    }
}
