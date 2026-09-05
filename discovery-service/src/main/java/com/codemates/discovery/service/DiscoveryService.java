package com.codemates.discovery.service;

import com.codemates.discovery.client.UserProfileServiceClient;
import com.codemates.discovery.dto.ProfileSearchResult;
import com.codemates.discovery.dto.SearchHistoryResponseDto;
import com.codemates.discovery.model.SearchHistory;
import com.codemates.discovery.repository.SearchHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DiscoveryService {

    private static final int MAX_RESULTS = 50;

    private final UserProfileServiceClient userProfileServiceClient;
    private final SearchHistoryRepository searchHistoryRepository;

    @Transactional
    public List<ProfileSearchResult> search(UUID userId,
                                             List<String> skills,
                                             String experienceLevel,
                                             List<String> interests,
                                             Boolean openToCollaborate) {

        List<ProfileSearchResult> results = userProfileServiceClient.searchProfiles(
                skills, experienceLevel, interests, openToCollaborate);

        List<ProfileSearchResult> capped = results.size() > MAX_RESULTS
                ? results.subList(0, MAX_RESULTS)
                : results;

        logSearch(userId, skills, experienceLevel, interests, openToCollaborate, capped.size());

        return capped;
    }

    @Transactional(readOnly = true)
    public List<SearchHistoryResponseDto> getMySearchHistory(UUID userId) {
        return searchHistoryRepository.findByUserIdAndIsDeletedFalseOrderByCreatedAtDesc(userId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private void logSearch(UUID userId, List<String> skills, String experienceLevel,
                            List<String> interests, Boolean openToCollaborate, int resultsCount) {
        try {
            SearchHistory history = new SearchHistory();
            history.setUserId(userId);
            history.setSearchQuery(buildQuerySummary(skills, experienceLevel, interests, openToCollaborate));
            history.setFiltersUsed(buildFiltersMap(skills, experienceLevel, interests, openToCollaborate));
            history.setResultsCount(resultsCount);
            history.setIsDeleted(false);
            searchHistoryRepository.save(history);
        } catch (Exception e) {
            // logging search history should never break the actual search
            log.error("Failed to save search history for userId: {}", userId, e);
        }
    }

    private Map<String, Object> buildFiltersMap(List<String> skills, String experienceLevel,
                                                 List<String> interests, Boolean openToCollaborate) {
        Map<String, Object> filters = new HashMap<>();
        if (skills != null && !skills.isEmpty()) filters.put("skills", skills);
        if (experienceLevel != null) filters.put("experienceLevel", experienceLevel);
        if (interests != null && !interests.isEmpty()) filters.put("interests", interests);
        if (openToCollaborate != null) filters.put("openToCollaborate", openToCollaborate);
        return filters;
    }

    private String buildQuerySummary(List<String> skills, String experienceLevel,
                                      List<String> interests, Boolean openToCollaborate) {
        StringBuilder sb = new StringBuilder();
        if (skills != null && !skills.isEmpty()) sb.append("skills: ").append(String.join(", ", skills)).append("; ");
        if (experienceLevel != null) sb.append("experience: ").append(experienceLevel).append("; ");
        if (interests != null && !interests.isEmpty()) sb.append("interests: ").append(String.join(", ", interests)).append("; ");
        if (openToCollaborate != null) sb.append("openToCollaborate: ").append(openToCollaborate);
        return sb.length() > 0 ? sb.toString().trim() : "all developers";
    }

    private SearchHistoryResponseDto toDto(SearchHistory h) {
        return SearchHistoryResponseDto.builder()
                .id(h.getId())
                .searchQuery(h.getSearchQuery())
                .filtersUsed(h.getFiltersUsed())
                .resultsCount(h.getResultsCount())
                .createdAt(h.getCreatedAt())
                .build();
    }
}
