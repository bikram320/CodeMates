package com.codemates.githubsync.event;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

import java.time.LocalDateTime;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class GithubSyncEventProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final JsonMapper objectMapper;

    public void publishCommitSynced(UUID userId, int repositoriesSynced) {
        try {
            GithubCommitSyncedEvent event = GithubCommitSyncedEvent.builder()
                    .userId(userId)
                    .repositoriesSynced(repositoriesSynced)
                    .timestamp(LocalDateTime.now())
                    .build();

            String payload = objectMapper.writeValueAsString(event);

            kafkaTemplate.send(
                    "github.commit.synced",
                    userId.toString(),
                    payload
            );

        } catch (Exception e) {
            log.error(
                    "Failed to publish github.commit.synced event: {}",
                    e.getMessage(),
                    e
            );
        }
    }
}