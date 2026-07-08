package com.codemates.githubsync.scheduler;

import com.codemates.githubsync.model.GithubProfile;
import com.codemates.githubsync.repository.GithubProfileRepository;
import com.codemates.githubsync.service.GithubSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class GithubSyncScheduler {

    private final GithubProfileRepository githubProfileRepository;
    private final GithubSyncService githubSyncService;

    // Runs once every day at 2 AM server time
    @Scheduled(cron = "0 0 2 * * *")
    public void syncAllProfiles() {
        log.info("Starting scheduled GitHub sync for all profiles");
        for (GithubProfile profile : githubProfileRepository.findAll()) {
            if (Boolean.TRUE.equals(profile.getIsDeleted())) continue;
            try {
                githubSyncService.syncUser(profile.getUserId());
            } catch (Exception e) {
                log.error("Scheduled sync failed for user {}: {}", profile.getUserId(), e.getMessage());
            }
        }
        log.info("Scheduled GitHub sync completed");
    }
}