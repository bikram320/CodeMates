package com.codemates.contribution.event;

import com.codemates.contribution.event.dto.GithubCommitSyncedEvent;
import com.codemates.contribution.service.ContributionScoreService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class GithubSyncEventConsumer {

    private final ContributionScoreService contributionScoreService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "github.commit.synced", groupId = "contribution-service")
    public void onCommitSynced(byte[] payload) {
        try {
            GithubCommitSyncedEvent event = objectMapper.readValue(payload, GithubCommitSyncedEvent.class);
            contributionScoreService.handleCommitsSynced(event);
        } catch (Exception e) {
            log.error("Failed to process github.commit.synced event", e);
        }
    }
}
