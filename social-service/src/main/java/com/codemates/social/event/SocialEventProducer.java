package com.codemates.social.event;

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
public class SocialEventProducer {

    private final KafkaTemplate<String, byte[]> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishConnectionRequestSent(UUID connectionId, UUID senderUserId, UUID receiverUserId) {
        try {
            ConnectionRequestSentEvent event = ConnectionRequestSentEvent.builder()
                    .connectionId(connectionId)
                    .senderUserId(senderUserId)
                    .receiverUserId(receiverUserId)
                    .timestamp(LocalDateTime.now())
                    .build();
            byte[] payload = objectMapper.writeValueAsBytes(event);
            kafkaTemplate.send("connection.request.sent", receiverUserId.toString(), payload);
        } catch (Exception e) {
            log.error("Failed to publish connection.request.sent event: {}", e.getMessage(), e);
        }
    }

    public void publishConnectionAccepted(UUID connectionId, UUID senderUserId, UUID receiverUserId) {
        try {
            ConnectionAcceptedEvent event = ConnectionAcceptedEvent.builder()
                    .connectionId(connectionId)
                    .senderUserId(senderUserId)
                    .receiverUserId(receiverUserId)
                    .timestamp(LocalDateTime.now())
                    .build();
            byte[] payload = objectMapper.writeValueAsBytes(event);
            kafkaTemplate.send("connection.accepted", senderUserId.toString(), payload);
        } catch (Exception e) {
            log.error("Failed to publish connection.accepted event: {}", e.getMessage(), e);
        }
    }
}