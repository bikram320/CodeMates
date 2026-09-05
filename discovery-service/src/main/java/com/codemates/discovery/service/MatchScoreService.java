package com.codemates.discovery.service;

import com.codemates.discovery.dto.MatchScoreResponseDto;
import com.codemates.discovery.dto.UpsertMatchScoreRequest;
import com.codemates.discovery.exception.MatchScoreNotFoundException;
import com.codemates.discovery.model.MatchScore;
import com.codemates.discovery.repository.MatchScoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Stores and retrieves match scores between users. The actual scoring
 * logic (the ML model) doesn't exist yet — this service just provides
 * the read/write plumbing so the ML engine has somewhere to write to
 * and the app has somewhere to read from, as soon as it's ready.
 *
 * Weighting used for totalMatchScore (adjust once the real model exists):
 * skill 40%, experience 20%, activity 20%, interest 20%.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchScoreService {

    private static final BigDecimal SKILL_WEIGHT = new BigDecimal("0.40");
    private static final BigDecimal EXPERIENCE_WEIGHT = new BigDecimal("0.20");
    private static final BigDecimal ACTIVITY_WEIGHT = new BigDecimal("0.20");
    private static final BigDecimal INTEREST_WEIGHT = new BigDecimal("0.20");

    private final MatchScoreRepository matchScoreRepository;

    @Transactional
    public MatchScoreResponseDto upsertMatchScore(UpsertMatchScoreRequest request) {
        MatchScore score = matchScoreRepository
                .findByUserIdAndMatchedUserIdAndIsDeletedFalse(request.getUserId(), request.getMatchedUserId())
                .orElseGet(MatchScore::new);

        score.setUserId(request.getUserId());
        score.setMatchedUserId(request.getMatchedUserId());
        score.setSkillScore(zeroIfNull(request.getSkillScore()));
        score.setExperienceScore(zeroIfNull(request.getExperienceScore()));
        score.setActivityScore(zeroIfNull(request.getActivityScore()));
        score.setInterestScore(zeroIfNull(request.getInterestScore()));
        score.setTotalMatchScore(computeTotal(score));
        score.setLastCalculatedAt(Instant.now());
        score.setIsDeleted(false);

        MatchScore saved = matchScoreRepository.save(score);
        log.info("Match score upserted: user {} <-> {} = {}",
                request.getUserId(), request.getMatchedUserId(), saved.getTotalMatchScore());

        return toDto(saved);
    }

    @Transactional(readOnly = true)
    public MatchScoreResponseDto getMatchScore(UUID userId, UUID matchedUserId) {
        MatchScore score = matchScoreRepository
                .findByUserIdAndMatchedUserIdAndIsDeletedFalse(userId, matchedUserId)
                .orElseThrow(() -> new MatchScoreNotFoundException(
                        "No match score found between " + userId + " and " + matchedUserId));
        return toDto(score);
    }

    @Transactional(readOnly = true)
    public List<MatchScoreResponseDto> getTopMatches(UUID userId, int limit) {
        int safeLimit = Math.min(limit, 50);
        return matchScoreRepository
                .findByUserIdAndIsDeletedFalseOrderByTotalMatchScoreDesc(userId, PageRequest.of(0, safeLimit))
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    private BigDecimal computeTotal(MatchScore score) {
        BigDecimal total = score.getSkillScore().multiply(SKILL_WEIGHT)
                .add(score.getExperienceScore().multiply(EXPERIENCE_WEIGHT))
                .add(score.getActivityScore().multiply(ACTIVITY_WEIGHT))
                .add(score.getInterestScore().multiply(INTEREST_WEIGHT));
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal zeroIfNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private MatchScoreResponseDto toDto(MatchScore s) {
        return MatchScoreResponseDto.builder()
                .id(s.getId())
                .userId(s.getUserId())
                .matchedUserId(s.getMatchedUserId())
                .skillScore(s.getSkillScore())
                .experienceScore(s.getExperienceScore())
                .activityScore(s.getActivityScore())
                .interestScore(s.getInterestScore())
                .totalMatchScore(s.getTotalMatchScore())
                .lastCalculatedAt(s.getLastCalculatedAt())
                .build();
    }
}
