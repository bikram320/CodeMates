package com.codemates.userprofile.service;

import com.codemates.userprofile.event.UserRegisteredEvent;
import com.codemates.userprofile.model.Profile;
import com.codemates.userprofile.repository.ProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class ProfileWriter {

    private final ProfileRepository profileRepository;

    @Transactional
    public Profile save(UserRegisteredEvent event, String username) {
        Profile profile = Profile.builder()
                .userId(event.getUserId())
                .username(username)
                .fullName(event.getFullName())
                .experienceLevel("BEGINNER")
                .activityStatus("ACTIVE")
                .isOpenToCollaborate(true)
                .isDeleted(false)
                .build();

        Profile saved = profileRepository.save(profile);
        log.info("Profile created for userId: {} with username: {}", event.getUserId(), username);
        return saved;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Profile saveInNewTransaction(UserRegisteredEvent event, String username) {
        Profile saved = save(event, username);
        log.info("Profile created (fallback) for userId: {} with username: {}", event.getUserId(), username);
        return saved;
    }
}