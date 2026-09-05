package com.codemates.discovery.controller;

import com.codemates.discovery.dto.ApiResponse;
import com.codemates.discovery.dto.MatchScoreResponseDto;
import com.codemates.discovery.dto.UpsertMatchScoreRequest;
import com.codemates.discovery.security.JwtCookieExtractor;
import com.codemates.discovery.service.MatchScoreService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/discovery/match-scores")
@RequiredArgsConstructor
public class MatchScoreController {

    private final MatchScoreService matchScoreService;
    private final JwtCookieExtractor jwtCookieExtractor;

    // Intended to be called by the ML recommendation engine once built.
    // Not tied to the caller's own JWT identity since it writes scores
    // for arbitrary user pairs computed offline.
    @PostMapping
    public ResponseEntity<ApiResponse<MatchScoreResponseDto>> upsert(
            @Valid @RequestBody UpsertMatchScoreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Match score saved", matchScoreService.upsertMatchScore(request)));
    }

    @GetMapping("/top")
    public ApiResponse<List<MatchScoreResponseDto>> topMatches(
            HttpServletRequest request,
            @RequestParam(defaultValue = "10") int limit) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Top matches fetched", matchScoreService.getTopMatches(userId, limit));
    }

    @GetMapping("/{matchedUserId}")
    public ApiResponse<MatchScoreResponseDto> getScore(
            HttpServletRequest request, @PathVariable UUID matchedUserId) {
        UUID userId = jwtCookieExtractor.extractUserId(request);
        return ApiResponse.success("Match score fetched", matchScoreService.getMatchScore(userId, matchedUserId));
    }
}
