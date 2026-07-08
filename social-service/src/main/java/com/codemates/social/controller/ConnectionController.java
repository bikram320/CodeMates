package com.codemates.social.controller;

import com.codemates.social.dto.ApiResponse;
import com.codemates.social.dto.ConnectionRequestDto;
import com.codemates.social.dto.ConnectionResponseDto;
import com.codemates.social.dto.ConnectionStatusResponseDto;
import com.codemates.social.dto.ConnectionSummaryDto;
import com.codemates.social.security.JwtCookieExtractor;
import com.codemates.social.service.ConnectionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/social/connections")
@RequiredArgsConstructor
public class ConnectionController {

    private final ConnectionService connectionService;
    private final JwtCookieExtractor jwtCookieExtractor;

    @PostMapping("/request")
    public ApiResponse<ConnectionResponseDto> sendRequest(
            HttpServletRequest request,
            @Valid @RequestBody ConnectionRequestDto dto) {
        UUID currentUserId = jwtCookieExtractor.extractUserId(request);
        ConnectionResponseDto result = connectionService.sendRequest(currentUserId, dto.getReceiverUserId());
        return ApiResponse.success("Connection request sent", result);
    }

    @PutMapping("/{id}/accept")
    public ApiResponse<ConnectionResponseDto> accept(HttpServletRequest request, @PathVariable UUID id) {
        UUID currentUserId = jwtCookieExtractor.extractUserId(request);
        ConnectionResponseDto result = connectionService.acceptRequest(id, currentUserId);
        return ApiResponse.success("Connection request accepted", result);
    }

    @PutMapping("/{id}/reject")
    public ApiResponse<ConnectionResponseDto> reject(HttpServletRequest request, @PathVariable UUID id) {
        UUID currentUserId = jwtCookieExtractor.extractUserId(request);
        ConnectionResponseDto result = connectionService.rejectRequest(id, currentUserId);
        return ApiResponse.success("Connection request rejected", result);
    }

    @PutMapping("/{id}/block")
    public ApiResponse<ConnectionResponseDto> block(HttpServletRequest request, @PathVariable UUID id) {
        UUID currentUserId = jwtCookieExtractor.extractUserId(request);
        ConnectionResponseDto result = connectionService.blockUser(id, currentUserId);
        return ApiResponse.success("User blocked", result);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> remove(HttpServletRequest request, @PathVariable UUID id) {
        UUID currentUserId = jwtCookieExtractor.extractUserId(request);
        connectionService.removeConnection(id, currentUserId);
        return ApiResponse.success("Connection removed", null);
    }

    @GetMapping
    public ApiResponse<List<ConnectionSummaryDto>> myConnections(HttpServletRequest request) {
        UUID currentUserId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Connections fetched", connectionService.getMyConnections(currentUserId));
    }

    @GetMapping("/pending")
    public ApiResponse<List<ConnectionResponseDto>> pendingRequests(HttpServletRequest request) {
        UUID currentUserId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Pending requests fetched", connectionService.getPendingRequests(currentUserId));
    }

    @GetMapping("/status/{userId}")
    public ApiResponse<ConnectionStatusResponseDto> status(HttpServletRequest request, @PathVariable UUID userId) {
        UUID currentUserId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Status fetched", connectionService.getConnectionStatus(currentUserId, userId));
    }
}