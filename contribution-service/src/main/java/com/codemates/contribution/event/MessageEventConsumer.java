package com.codemates.contribution.event;

import com.codemates.contribution.event.dto.MessageSentEvent;
import com.codemates.contribution.service.ContributionScoreService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageEventConsumer {

    private final ContributionScoreService contributionScoreService;
    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "message.sent", groupId = "contribution-service")
    public void onMessageSent(byte[] payload) {
        try {
            MessageSentEvent event = objectMapper.readValue(payload, MessageSentEvent.class);
            contributionScoreService.handleMessageSent(event);
        } catch (Exception e) {
            log.error("Failed to process message.sent event", e);
        }
    }
}
