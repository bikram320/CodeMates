package com.codemates.discovery.controller;

import com.codemates.discovery.dto.ApiResponse;
import com.codemates.discovery.dto.ProfileSearchResult;
import com.codemates.discovery.dto.SearchHistoryResponseDto;
import com.codemates.discovery.security.JwtCookieExtractor;
import com.codemates.discovery.service.DiscoveryService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/discovery")
@RequiredArgsConstructor
public class DiscoverySearchController {

    private final DiscoveryService discoveryService;
    private final JwtCookieExtractor jwtCookieExtractor;

    @GetMapping("/search")
    public ApiResponse<List<ProfileSearchResult>> search(
            HttpServletRequest request,
            @RequestParam(required = false) List<String> skills,
            @RequestParam(required = false) String experienceLevel,
            @RequestParam(required = false) List<String> interests,
            @RequestParam(required = false) Boolean openToCollaborate) {

        UUID userId = jwtCookieExtractor.extractUserId(request);
        List<ProfileSearchResult> results = discoveryService.search(
                userId, skills, experienceLevel, interests, openToCollaborate);

        return ApiResponse.success("Search results fetched", results);
    }

    @GetMapping("/search/history")
    public ApiResponse<List<SearchHistoryResponseDto>> myHistory(HttpServletRequest request) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Search history fetched", discoveryService.getMySearchHistory(userId));
    }

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("Discovery service is running", null);
    }
}
