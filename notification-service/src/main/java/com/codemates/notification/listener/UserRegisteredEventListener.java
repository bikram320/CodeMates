package com.codemates.notification.listener;

import com.codemates.notification.event.UserRegisteredEventPayload;
import com.codemates.notification.service.NotificationService;
import com.codemates.notification.service.NotificationType;
import com.codemates.notification.service.UserContactService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserRegisteredEventListener {

    private final ObjectMapper objectMapper;
    private final UserContactService userContactService;
    private final NotificationService notificationService;

    @KafkaListener(topics = "user.registered", groupId = "${spring.kafka.consumer.group-id:notification-service}")
    public void handle(byte[] payload) {
        try {
            UserRegisteredEventPayload event = objectMapper.readValue(payload, UserRegisteredEventPayload.class);

            userContactService.upsert(event.getUserId(), event.getEmail(), event.getUsername(), event.getFullName());

            String displayName = event.getFullName() != null && !event.getFullName().isBlank()
                    ? event.getFullName() : event.getUsername();

            notificationService.create(
                    event.getUserId(),
                    null,
                    NotificationType.WELCOME,
                    "Welcome to CodeMates!",
                    "Hey " + displayName + ", welcome aboard! Start by exploring projects or completing your profile.",
                    null,
                    null,
                    false // no email - this is an in-app-only welcome, auth-service may already send its own
            );
        } catch (Exception e) {
            log.error("Failed to process user.registered event: {}", e.getMessage(), e);
        }
    }
}
