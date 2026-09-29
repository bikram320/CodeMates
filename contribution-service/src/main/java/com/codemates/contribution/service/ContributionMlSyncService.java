package com.codemates.contribution.service;

import com.codemates.contribution.client.GithubSyncServiceClient;
import com.codemates.contribution.client.MlServiceClient;
import com.codemates.contribution.dto.*;
import com.codemates.contribution.model.ContributionScore;
import com.codemates.contribution.model.ProjectRepositoryLink;
import com.codemates.contribution.repository.ContributionScoreRepository;
import com.codemates.contribution.repository.ProjectRepositoryLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContributionMlSyncService {

    private final ProjectRepositoryLinkRepository repoLinkRepository;
    private final ContributionScoreRepository scoreRepository;
    private final GithubSyncServiceClient githubSyncServiceClient;
    private final MlServiceClient mlServiceClient;
    private final TransactionTemplate tx;

    // Deliberately NOT @Transactional: HTTP calls must not hold a DB connection.
    public void predictSignificanceForProject(UUID projectId) {
        List<ProjectRepositoryLink> links = repoLinkRepository.findByProjectIdAndIsDeletedFalse(projectId);
        if (links.isEmpty()) {
            log.info("No linked repositories for project {} -- nothing to predict", projectId);
            return;
        }

        List<MlContributionPairDto> pairs = new ArrayList<>();
        for (ProjectRepositoryLink link : links) {
            DeveloperSkillProfileDto devProfile;
            RepoContextDto repoContext;
            try {
                devProfile = githubSyncServiceClient.getSkillProfile(link.getUserId());
                repoContext = githubSyncServiceClient.getRepoContext(link.getRepositoryId());
            } catch (Exception e) {
                log.warn("Skipping user {} / repo {} for project {} -- lookup failed: {}",
                        link.getUserId(), link.getRepositoryId(), projectId, e.getMessage());
                continue;
            }

            pairs.add(MlContributionPairDto.builder()
                    .userId(link.getUserId().toString())
                    .projectId(projectId.toString())
                    .developer(MlDeveloperProfileDto.builder()
                            .userId(link.getUserId().toString())
                            .publicRepos(devProfile.getPublicRepos())
                            .publicGists(devProfile.getPublicGists())
                            .followers(devProfile.getFollowers())
                            .following(devProfile.getFollowing())
                            .accountAgeDays(devProfile.getAccountAgeDays())
                            .primaryLanguage(devProfile.getPrimaryLanguage())
                            .build())
                    .project(MlProjectContextDto.builder()
                            .projectId(projectId.toString())
                            .stars(repoContext.getStars())
                            .forks(repoContext.getForks())
                            .subscribers(repoContext.getSubscribers())
                            .topicCount(repoContext.getTopics() != null ? repoContext.getTopics().size() : 0)
                            .language(repoContext.getLanguage())
                            .build())
                    .build());
        }

        if (pairs.isEmpty()) {
            log.warn("No valid developer/repo pairs for project {} -- nothing to score", projectId);
            return;
        }

        MlContributionBatchResponse response = mlServiceClient.predictBatch(
                MlContributionBatchRequest.builder().pairs(pairs).build());

        if (response.getResults() == null || response.getResults().isEmpty()) {
            log.error("ML service returned no results for project {}", projectId);
            return;
        }

        // Short write transaction, after all HTTP work is done.
        tx.executeWithoutResult(status -> {
            for (MlContributionResultDto result : response.getResults()) {
                UUID userId = UUID.fromString(result.getUserId());
                ContributionScore score = scoreRepository
                        .findByUserIdAndProjectIdAndIsDeletedFalse(userId, projectId)
                        .orElseGet(() -> newScore(userId, projectId));

                score.setSignificanceProbability(result.getSignificanceProbability());
                score.setSignificancePredictedAt(Instant.now());
                score.setUpdatedAt(Instant.now());
                scoreRepository.save(score);
            }
        });
        log.info("Significance prediction complete for project {}: {} members scored",
                projectId, response.getResults().size());
    }

    private ContributionScore newScore(UUID userId, UUID projectId) {
        Instant now = Instant.now();
        ContributionScore s = new ContributionScore();
        s.setUserId(userId);
        s.setProjectId(projectId);
        s.setTasksCompleted(0);
        s.setTasksReviewed(0);
        s.setMessagesSent(0);
        s.setCommitsCount(0);
        s.setFilesShared(0);
        s.setTotalScore(BigDecimal.ZERO);
        s.setIsDeleted(false);
        s.setCreatedAt(now);
        s.setUpdatedAt(now);
        s.setLastCalculatedAt(now);
        return s;
    }
}