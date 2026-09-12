package com.codemates.messaging.controller;

import com.codemates.messaging.dto.ApiResponse;
import com.codemates.messaging.dto.ConversationResponse;
import com.codemates.messaging.dto.StartDirectConversationRequest;
import com.codemates.messaging.security.JwtCookieExtractor;
import com.codemates.messaging.service.ConversationService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/conversations")
@RequiredArgsConstructor
public class ConversationController {

    private final ConversationService conversationService;
    private final JwtCookieExtractor jwtCookieExtractor;

    @PostMapping("/direct")
    public ResponseEntity<ApiResponse<ConversationResponse>> startDirect(
            HttpServletRequest request, @Valid @RequestBody StartDirectConversationRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Conversation ready",
                        conversationService.startOrGetDirectConversation(userId, dto.getTargetUserId())));
    }

    @GetMapping("/my")
    public ApiResponse<List<ConversationResponse>> myConversations(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Conversations fetched", conversationService.getMyConversations(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<ConversationResponse> getById(HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Conversation fetched", conversationService.getConversation(userId, id));
    }

    @PutMapping("/{id}/read")
    public ApiResponse<Void> markRead(HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        conversationService.markRead(userId, id);
        return ApiResponse.success("Marked as read", null);
    }

    @PutMapping("/{id}/mute")
    public ApiResponse<Void> mute(HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        conversationService.setMuted(userId, id, true);
        return ApiResponse.success("Conversation muted", null);
    }

    @PutMapping("/{id}/unmute")
    public ApiResponse<Void> unmute(HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        conversationService.setMuted(userId, id, false);
        return ApiResponse.success("Conversation unmuted", null);
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Messaging service is running", null);
    }
}
