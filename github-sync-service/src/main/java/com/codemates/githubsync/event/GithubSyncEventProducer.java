package com.codemates.githubsync.event;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class GithubSyncEventProducer {

    private final KafkaTemplate<String, byte[]> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishCommitSynced(UUID userId, int repositoriesSynced) {
        try {
            GithubCommitSyncedEvent event = GithubCommitSyncedEvent.builder()
                    .userId(userId)
                    .repositoriesSynced(repositoriesSynced)
                    .timestamp(LocalDateTime.now())
                    .build();
            byte[] payload = objectMapper.writeValueAsBytes(event);
            kafkaTemplate.send("github.commit.synced", userId.toString(), payload);
        } catch (Exception e) {
            log.error("Failed to publish github.commit.synced event: {}", e.getMessage(), e);
        }
    }
}