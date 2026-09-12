package com.codemates.messaging.event;

import com.codemates.messaging.model.Conversation;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageEventProducer {

    private final KafkaTemplate<String, byte[]> kafkaTemplate;
    private final ObjectMapper objectMapper;

    public void publishMessageSent(UUID messageId, Conversation conversation, UUID senderUserId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("messageId", messageId);
        payload.put("conversationId", conversation.getId());
        payload.put("conversationType", conversation.getType());
        payload.put("projectId", conversation.getProjectId());
        payload.put("senderUserId", senderUserId);

        publish("message.sent", conversation.getId(), payload);
    }

    private void publish(String topic, UUID key, Object payload) {
        try {
            byte[] bytes = objectMapper.writeValueAsBytes(payload);
            kafkaTemplate.send(topic, key.toString(), bytes);
        } catch (Exception e) {
            log.error("Failed to publish event on topic {}", topic, e);
        }
    }
}
