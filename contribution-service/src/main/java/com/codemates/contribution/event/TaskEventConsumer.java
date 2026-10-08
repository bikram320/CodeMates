package com.codemates.contribution.event;

import com.codemates.contribution.event.dto.TaskCompletedEvent;
import com.codemates.contribution.service.ContributionScoreService;
import tools.jackson.databind.json.JsonMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskEventConsumer {

    private final ContributionScoreService contributionScoreService;
    private final JsonMapper objectMapper;

    @KafkaListener(topics = "task.completed", groupId = "contribution-service")
    public void onTaskCompleted(String payload) {
        try {
            TaskCompletedEvent event = objectMapper.readValue(payload, TaskCompletedEvent.class);
            contributionScoreService.handleTaskCompleted(event);
        } catch (Exception e) {
            log.error("Failed to process task.completed event", e);
        }
    }
}