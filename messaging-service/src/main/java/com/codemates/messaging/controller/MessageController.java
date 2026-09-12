package com.codemates.messaging.controller;

import com.codemates.messaging.dto.ApiResponse;
import com.codemates.messaging.dto.EditMessageRequest;
import com.codemates.messaging.dto.MessagePageResponse;
import com.codemates.messaging.dto.MessageResponse;
import com.codemates.messaging.security.JwtCookieExtractor;
import com.codemates.messaging.service.MessageService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final JwtCookieExtractor jwtCookieExtractor;

    @GetMapping("/api/conversations/{conversationId}/messages")
    public ApiResponse<MessagePageResponse> history(
            HttpServletRequest request,
            @PathVariable UUID conversationId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant before,
            @RequestParam(required = false) Integer limit) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Messages fetched", messageService.getHistory(userId, conversationId, before, limit));
    }

    @PutMapping("/api/messages/{id}")
    public ApiResponse<MessageResponse> edit(
            HttpServletRequest request, @PathVariable UUID id, @Valid @RequestBody EditMessageRequest dto) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Message updated", messageService.editMessage(userId, id, dto));
    }

    @DeleteMapping("/api/messages/{id}")
    public ApiResponse<Void> delete(HttpServletRequest request, @PathVariable UUID id) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        messageService.deleteMessage(userId, id);
        return ApiResponse.success("Message deleted", null);
    }
}
