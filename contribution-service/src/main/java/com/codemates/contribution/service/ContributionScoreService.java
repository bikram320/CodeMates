package com.codemates.contribution.service;

import com.codemates.contribution.client.GithubSyncServiceClient;
import com.codemates.contribution.client.ProjectServiceClient;
import com.codemates.contribution.config.ScoringProperties;
import com.codemates.contribution.dto.ContributionEventResponse;
import com.codemates.contribution.dto.ContributionScoreResponse;
import com.codemates.contribution.dto.GithubCommitStatDto;
import com.codemates.contribution.dto.ProjectTaskDto;
import com.codemates.contribution.event.dto.GithubCommitSyncedEvent;
import com.codemates.contribution.event.dto.MessageSentEvent;
import com.codemates.contribution.event.dto.TaskCompletedEvent;
import com.codemates.contribution.model.ContributionEvent;
import com.codemates.contribution.model.ContributionScore;
import com.codemates.contribution.model.ProjectRepositoryLink;
import com.codemates.contribution.repository.ContributionEventRepository;
import com.codemates.contribution.repository.ContributionScoreRepository;
import com.codemates.contribution.repository.ProjectRepositoryLinkRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ContributionScoreService {

    private static final String EVENT_TASK_COMPLETED = "TASK_COMPLETED";
    private static final String EVENT_COMMIT = "COMMIT";
    private static final String EVENT_MESSAGE_SENT = "MESSAGE_SENT";
    private static final String CONVERSATION_TYPE_PROJECT = "PROJECT";

    private final ContributionScoreRepository scoreRepository;
    private final ContributionEventRepository eventRepository;
    private final ProjectRepositoryLinkRepository repoLinkRepository;
    private final ScoringProperties scoringProperties;
    private final ProjectServiceClient projectServiceClient;
    private final GithubSyncServiceClient githubSyncServiceClient;
    private final TransactionTemplate tx;

    // ── task.completed consumer entry point ──────────────────
    @Transactional
    public void handleTaskCompleted(TaskCompletedEvent event) {
        if (eventRepository.existsByReferenceIdAndEventTypeAndIsDeletedFalse(event.getTaskId(), EVENT_TASK_COMPLETED)) {
            log.info("Task {} already scored, skipping duplicate event", event.getTaskId());
            return;
        }

        ProjectTaskDto task = projectServiceClient.getTask(event.getProjectId(), event.getTaskId());
        BigDecimal points = scoringProperties.pointsForPriority(task.getPriority());

        ContributionScore score = getOrCreateScore(event.getCompletedByUserId(), event.getProjectId());
        score.setTasksCompleted(score.getTasksCompleted() + 1);
        applyPoints(score, points);
        scoreRepository.save(score);

        logEvent(event.getCompletedByUserId(), event.getProjectId(), EVENT_TASK_COMPLETED, points,
                event.getTaskId(), "TASK", "Task completed (" + task.getPriority() + " priority)");
    }

    public void handleCommitsSynced(GithubCommitSyncedEvent event) {
        for (ProjectRepositoryLink link : repoLinkRepository.findByUserIdAndIsDeletedFalse(event.getUserId())) {
            syncCommitsForLink(link.getId());
        }
    }

    /** Also called right after a repo is linked, so existing commits are credited immediately. */
    public void syncCommitsForLink(UUID linkId) {
        ProjectRepositoryLink link = repoLinkRepository.findById(linkId).orElse(null);
        if (link == null || Boolean.TRUE.equals(link.getIsDeleted())) return;

        GithubCommitStatDto stats;
        try {
            stats = githubSyncServiceClient.getCommitStats(link.getRepositoryId());   // HTTP, no transaction
        } catch (Exception e) {
            log.error("Commit stats fetch failed for repo {}", link.getRepositoryId(), e);
            return;
        }
        int currentTotal = stats.getTotalCommits() != null ? stats.getTotalCommits() : 0;
        tx.executeWithoutResult(s -> applyCommitDelta(linkId, currentTotal));
    }

    private void applyCommitDelta(UUID linkId, int currentTotal) {
        ProjectRepositoryLink link = repoLinkRepository.findById(linkId).orElseThrow();
        int newCommits = currentTotal - link.getLastKnownTotalCommits();
        if (newCommits <= 0) return;

        BigDecimal points = scoringProperties.getCommit().multiply(BigDecimal.valueOf(newCommits));
        ContributionScore score = getOrCreateScore(link.getUserId(), link.getProjectId());
        score.setCommitsCount(score.getCommitsCount() + newCommits);
        applyPoints(score, points);
        scoreRepository.save(score);

        link.setLastKnownTotalCommits(currentTotal);
        link.setUpdatedAt(Instant.now());
        repoLinkRepository.save(link);

        logEvent(link.getUserId(), link.getProjectId(), EVENT_COMMIT, points,
                link.getRepositoryId(), "REPOSITORY", newCommits + " new commit(s) synced");
    }

    // ── message.sent consumer entry point ─────────────────────
    @Transactional
    public void handleMessageSent(MessageSentEvent event) {
        if (event.getProjectId() == null || !CONVERSATION_TYPE_PROJECT.equalsIgnoreCase(event.getConversationType())) {
            return; // only project-conversation messages count toward a project contribution score
        }
        if (eventRepository.existsByReferenceIdAndEventTypeAndIsDeletedFalse(event.getMessageId(), EVENT_MESSAGE_SENT)) {
            log.info("Message {} already scored, skipping duplicate event", event.getMessageId());
            return;
        }

        Instant startOfDay = Instant.now().truncatedTo(ChronoUnit.DAYS);
        long todayCount = eventRepository.countByUserIdAndProjectIdAndEventTypeSince(
                event.getSenderUserId(), event.getProjectId(), EVENT_MESSAGE_SENT, startOfDay);

        boolean underCap = todayCount < scoringProperties.getMessageDailyCap();
        BigDecimal points = underCap ? scoringProperties.getMessage() : BigDecimal.ZERO;

        ContributionScore score = getOrCreateScore(event.getSenderUserId(), event.getProjectId());
        score.setMessagesSent(score.getMessagesSent() + 1);
        applyPoints(score, points);
        scoreRepository.save(score);

        String description = underCap ? "Message sent" : "Message sent (daily cap reached, no points)";
        logEvent(event.getSenderUserId(), event.getProjectId(), EVENT_MESSAGE_SENT, points,
                event.getMessageId(), "MESSAGE", description);
    }

    // ── reads ───────────────────────────────────────────────
    @Transactional(readOnly = true)
    public ContributionScoreResponse getScore(UUID userId, UUID projectId) {
        return scoreRepository.findByUserIdAndProjectIdAndIsDeletedFalse(userId, projectId)
                .map(this::toResponse)
                .orElseGet(() -> emptyResponse(userId, projectId));
    }

    @Transactional(readOnly = true)
    public List<ContributionScoreResponse> getLeaderboard(UUID projectId) {
        return scoreRepository.findByProjectIdAndIsDeletedFalseOrderByTotalScoreDesc(projectId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ContributionEventResponse> getEventHistory(UUID userId, UUID projectId) {
        return eventRepository.findByUserIdAndProjectIdAndIsDeletedFalseOrderByCreatedAtDesc(userId, projectId).stream()
                .map(this::toEventResponse)
                .collect(Collectors.toList());
    }

    // ── internal helpers ───────────────────────────────────
    private ContributionScore getOrCreateScore(UUID userId, UUID projectId) {
        return scoreRepository.findByUserIdAndProjectIdAndIsDeletedFalse(userId, projectId)
                .orElseGet(() -> {
                    ContributionScore score = new ContributionScore();
                    score.setUserId(userId);
                    score.setProjectId(projectId);
                    score.setTasksCompleted(0);
                    score.setTasksReviewed(0);
                    score.setMessagesSent(0);
                    score.setCommitsCount(0);
                    score.setFilesShared(0);
                    score.setTotalScore(BigDecimal.ZERO);
                    score.setIsDeleted(false);
                    score.setCreatedAt(Instant.now());
                    score.setUpdatedAt(Instant.now());
                    return score;
                });
    }

    private void applyPoints(ContributionScore score, BigDecimal points) {
        score.setTotalScore(score.getTotalScore().add(points));
        score.setLastCalculatedAt(Instant.now());
        score.setUpdatedAt(Instant.now());
    }

    private void logEvent(UUID userId, UUID projectId, String eventType, BigDecimal points,
                          UUID referenceId, String referenceType, String description) {
        ContributionEvent event = new ContributionEvent();
        event.setId(UUID.randomUUID()); // entity has no @GeneratedValue on its id
        event.setUserId(userId);
        event.setProjectId(projectId);
        event.setEventType(eventType);
        event.setPointsAwarded(points);
        event.setReferenceId(referenceId);
        event.setReferenceType(referenceType);
        event.setDescription(description);
        event.setIsDeleted(false);
        eventRepository.save(event);
    }

    private ContributionScoreResponse toResponse(ContributionScore s) {
        return ContributionScoreResponse.builder()
                .userId(s.getUserId())
                .projectId(s.getProjectId())
                .tasksCompleted(s.getTasksCompleted())
                .tasksReviewed(s.getTasksReviewed())
                .messagesSent(s.getMessagesSent())
                .commitsCount(s.getCommitsCount())
                .filesShared(s.getFilesShared())
                .totalScore(s.getTotalScore())
                .lastCalculatedAt(s.getLastCalculatedAt())
                .significanceProbability(s.getSignificanceProbability())
                .significancePredictedAt(s.getSignificancePredictedAt())
                .build();
    }

    private ContributionScoreResponse emptyResponse(UUID userId, UUID projectId) {
        return ContributionScoreResponse.builder()
                .userId(userId)
                .projectId(projectId)
                .tasksCompleted(0)
                .tasksReviewed(0)
                .messagesSent(0)
                .commitsCount(0)
                .filesShared(0)
                .totalScore(BigDecimal.ZERO)
                .lastCalculatedAt(null)
                .significanceProbability(null)
                .significancePredictedAt(null)
                .build();
    }

    private ContributionEventResponse toEventResponse(ContributionEvent e) {
        return ContributionEventResponse.builder()
                .id(e.getId())
                .userId(e.getUserId())
                .projectId(e.getProjectId())
                .eventType(e.getEventType())
                .pointsAwarded(e.getPointsAwarded())
                .referenceId(e.getReferenceId())
                .referenceType(e.getReferenceType())
                .description(e.getDescription())
                .createdAt(e.getCreatedAt())
                .build();
    }
}