package com.codemates.discovery.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
public class SearchHistoryResponseDto {
    private UUID id;
    private String searchQuery;
    private Map<String, Object> filtersUsed;
    private Integer resultsCount;
    private Instant createdAt;
}
