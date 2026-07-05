package com.codemates.userprofile.kafka;

import com.codemates.userprofile.event.UserRegisteredEvent;
import com.codemates.userprofile.service.ProfileService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserRegisteredConsumer {

    private final ProfileService profileService;
    private final ObjectMapper objectMapper;


    // Listens to user.registered topic
    // fires every time a new user registers
    // in auth-service
    @KafkaListener(
            topics = "user.registered",
            groupId = "${spring.kafka.consumer.group-id}"
    )
    public void handleUserRegistered(byte[] message) {
        try {
            // deserialize bytes back into event object
            UserRegisteredEvent event = objectMapper.readValue(
                    message, UserRegisteredEvent.class);

            log.info("Received user.registered event for userId: {}",
                    event.getUserId());

            // auto-create profile for this new user
            profileService.createProfileFromEvent(event);

        } catch (Exception e) {
            log.error("Failed to process user.registered event: {}",
                    e.getMessage(), e);
        }
    }
}