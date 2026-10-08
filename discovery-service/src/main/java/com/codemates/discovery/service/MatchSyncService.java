package com.codemates.discovery.service;

import com.codemates.discovery.client.GithubProfileClient;
import com.codemates.discovery.client.MlMatchClient;
import com.codemates.discovery.dto.GithubSkillProfileDto;
import com.codemates.discovery.dto.MlMatchDtos.*;
import com.codemates.discovery.dto.UpsertMatchScoreRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Computes real match scores for a user against a set of candidates, using
 * the shared ml-service (Model 1). Writes results through the existing
 * MatchScoreService, same as the ML engine was always intended to.
 *
 * Model 1's match_probability maps directly onto skillScore (40% weight) --
 * the model genuinely measures language/topic overlap, so this is an honest
 * mapping, not a placeholder. experienceScore/activityScore/interestScore
 * are left at 0 until separate logic/models compute them.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MatchSyncService {

    private final GithubProfileClient githubProfileClient;
    private final MlMatchClient mlMatchClient;
    private final MatchScoreService matchScoreService;

    public void syncMatchesForUser(UUID userId, List<UUID> candidateIds) {
        GithubSkillProfileDto.Data userProfile = githubProfileClient.fetchSkillProfile(userId);
        if (userProfile == null) {
            log.warn("No GitHub skill profile for user {} -- cannot compute matches", userId);
            return;
        }

        List<MatchPairDto> pairs = new ArrayList<>();
        for (UUID candidateId : candidateIds) {
            if (candidateId.equals(userId)) continue; // never match a user with themselves

            GithubSkillProfileDto.Data candidateProfile = githubProfileClient.fetchSkillProfile(candidateId);
            if (candidateProfile == null) {
                log.info("No GitHub skill profile for candidate {} -- skipping this pair", candidateId);
                continue;
            }

            pairs.add(MatchPairDto.builder()
                    .userId(userId.toString())
                    .candidateId(candidateId.toString())
                    .devA(toRequest(userProfile))
                    .devB(toRequest(candidateProfile))
                    .build());
        }

        if (pairs.isEmpty()) {
            log.info("No valid candidate pairs for user {} -- nothing to score", userId);
            return;
        }

        MatchBatchPredictResponseDto response = mlMatchClient
                .predictBatch(MatchBatchPredictRequestDto.builder().pairs(pairs).build())
                .block();

        if (response == null || response.getResults() == null) {
            log.error("ML service returned no results for match sync (user {})", userId);
            return;
        }

        for (MatchPredictionResultDto result : response.getResults()) {
            UpsertMatchScoreRequest upsert = new UpsertMatchScoreRequest();
            upsert.setUserId(UUID.fromString(result.getUserId()));
            upsert.setMatchedUserId(UUID.fromString(result.getCandidateId()));
            // match_probability (0-1) -> skillScore on a 0-100 scale -- Model 1 genuinely
            // measures skill/language/topic overlap, so this is a direct, honest mapping.
            upsert.setSkillScore(BigDecimal.valueOf(result.getMatchProbability() * 100));
            // experienceScore/activityScore/interestScore intentionally left null
            // (MatchScoreService.zeroIfNull handles this) until separate logic exists.
            matchScoreService.upsertMatchScore(upsert);
        }
        log.info("Match sync complete for user {}: {} scores written", userId, response.getResults().size());
    }

    private DeveloperSkillProfileRequest toRequest(GithubSkillProfileDto.Data p) {
        return DeveloperSkillProfileRequest.builder()
                .userId(p.getUserId())
                .languages(p.getLanguages())
                .topics(p.getTopics())
                .primaryLanguage(p.getPrimaryLanguage())
                .publicRepos(p.getPublicRepos())
                .publicGists(p.getPublicGists())
                .followers(p.getFollowers())
                .following(p.getFollowing())
                .accountAgeDays(p.getAccountAgeDays())
                .build();
    }
}
