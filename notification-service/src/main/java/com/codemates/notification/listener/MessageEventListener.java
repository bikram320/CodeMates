package com.codemates.notification.listener;

import com.codemates.notification.client.MessagingServiceClient;
import com.codemates.notification.event.MessageSentPayload;
import com.codemates.notification.service.NotificationService;
import com.codemates.notification.service.NotificationType;
import com.codemates.notification.service.ReferenceType;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class MessageEventListener {

    private final ObjectMapper objectMapper;
    private final NotificationService notificationService;
    private final MessagingServiceClient messagingServiceClient;

    @KafkaListener(topics = "message.sent", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handle(byte[] payload) {
        try {
            MessageSentPayload event = objectMapper.readValue(payload, MessageSentPayload.class);

            // UNVERIFIED - see MessagingServiceClient/ConversationDetailResponse javadoc and
            // README. If this call fails or the endpoint doesn't exist yet, getOtherParticipants
            // returns an empty list and no notification is created (fails safe, not loud).
            for (UUID recipientUserId : messagingServiceClient.getOtherParticipants(event.getConversationId(), event.getSenderUserId())) {
                notificationService.create(
                        recipientUserId, event.getSenderUserId(), NotificationType.MESSAGE_RECEIVED,
                        "New message",
                        "You have a new message.", // no message `type`/preview field on the source event - known gap
                        event.getConversationId(), ReferenceType.CONVERSATION, false); // in-app only, per scope decision
            }
        } catch (Exception e) {
            log.error("Failed to process message.sent event: {}", e.getMessage(), e);
        }
    }
}
