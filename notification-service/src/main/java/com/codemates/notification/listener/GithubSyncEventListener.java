package com.codemates.notification.listener;

import com.codemates.notification.event.GithubCommitSyncedPayload;
import com.codemates.notification.service.NotificationService;
import com.codemates.notification.service.NotificationType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Slf4j
@Component
@RequiredArgsConstructor
public class GithubSyncEventListener {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;

    @KafkaListener(topics = "github.commit.synced", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handle(byte[] payload) {
        try {
            GithubCommitSyncedPayload event = objectMapper.readValue(payload, GithubCommitSyncedPayload.class);

            notificationService.create(
                    event.getUserId(), null, NotificationType.GITHUB_SYNC_COMPLETED,
                    "GitHub sync complete",
                    "Synced " + event.getRepositoriesSynced() + " repositor" +
                            (event.getRepositoriesSynced() == 1 ? "y" : "ies") + " from GitHub.",
                    null, null, false);
        } catch (Exception e) {
            log.error("Failed to process github.commit.synced event: {}", e.getMessage(), e);
        }
    }
}
