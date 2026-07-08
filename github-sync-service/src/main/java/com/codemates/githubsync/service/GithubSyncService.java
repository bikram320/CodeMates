package com.codemates.githubsync.service;

import com.codemates.githubsync.client.GithubApiClient;
import com.codemates.githubsync.dto.*;
import com.codemates.githubsync.dto.github.GithubRepoApiResponse;
import com.codemates.githubsync.dto.github.GithubUserApiResponse;
import com.codemates.githubsync.event.GithubSyncEventProducer;
import com.codemates.githubsync.exception.GithubProfileNotFoundException;
import com.codemates.githubsync.model.CommitStat;
import com.codemates.githubsync.model.GithubProfile;
import com.codemates.githubsync.model.Repository;
import com.codemates.githubsync.repository.CommitStatRepository;
import com.codemates.githubsync.repository.GithubProfileRepository;
import com.codemates.githubsync.repository.RepositoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubSyncService {

    private final GithubProfileRepository githubProfileRepository;
    private final RepositoryRepository repositoryRepository;
    private final CommitStatRepository commitStatRepository;
    private final GithubApiClient githubApiClient;
    private final GithubSyncEventProducer eventProducer;

    @Transactional
    public GithubProfileResponseDto connect(UUID userId, String accessToken) {
        GithubUserApiResponse apiUser = githubApiClient.fetchAuthenticatedUser(accessToken);

        GithubProfile profile = githubProfileRepository.findByUserIdAndIsDeletedFalse(userId)
                .orElseGet(GithubProfile::new);

        profile.setUserId(userId);
        profile.setGithubUsername(apiUser.getLogin());
        profile.setGithubUserId(String.valueOf(apiUser.getGithubId()));
        profile.setGithubAccessToken(accessToken);
        profile.setAvatarUrl(apiUser.getAvatarUrl());
        profile.setBio(apiUser.getBio());
        profile.setPublicReposCount(apiUser.getPublicRepos());
        profile.setFollowersCount(apiUser.getFollowers());
        profile.setFollowingCount(apiUser.getFollowing());
        profile.setIsDeleted(false);

        GithubProfile saved = githubProfileRepository.save(profile);
        return toProfileDto(saved);
    }

    @Transactional
    public SyncResultDto syncUser(UUID userId) {
        GithubProfile profile = githubProfileRepository.findByUserIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new GithubProfileNotFoundException("No GitHub profile connected for this user. Connect first."));

        String token = profile.getGithubAccessToken();

        // Refresh profile-level stats
        GithubUserApiResponse apiUser = githubApiClient.fetchAuthenticatedUser(token);
        profile.setPublicReposCount(apiUser.getPublicRepos());
        profile.setFollowersCount(apiUser.getFollowers());
        profile.setFollowingCount(apiUser.getFollowing());
        profile.setLastSyncedAt(LocalDateTime.now());
        githubProfileRepository.save(profile);

        List<GithubRepoApiResponse> apiRepos = githubApiClient.fetchUserRepos(token);
        int syncedCount = 0;

        for (GithubRepoApiResponse apiRepo : apiRepos) {
            Repository repo = repositoryRepository
                    .findByGithubProfileIdAndRepoFullNameAndIsDeletedFalse(profile.getId(), apiRepo.getFullName())
                    .orElseGet(Repository::new);

            repo.setGithubProfileId(profile.getId());
            repo.setUserId(userId);
            repo.setRepoName(apiRepo.getName());
            repo.setRepoFullName(apiRepo.getFullName());
            repo.setRepoUrl(apiRepo.getHtmlUrl());
            repo.setDescription(apiRepo.getDescription());
            repo.setPrimaryLanguage(apiRepo.getLanguage());
            repo.setStarsCount(apiRepo.getStargazersCount());
            repo.setForksCount(apiRepo.getForksCount());
            repo.setIsPrivate(Boolean.TRUE.equals(apiRepo.getIsPrivate()));
            repo.setIsForked(Boolean.TRUE.equals(apiRepo.getFork()));
            repo.setLastPushedAt(parseGithubDate(apiRepo.getPushedAt()));
            repo.setLastSyncedAt(LocalDateTime.now());
            repo.setIsDeleted(false);

            Repository savedRepo = repositoryRepository.save(repo);
            syncCommitStats(savedRepo, profile.getGithubUsername(), token);
            syncedCount++;
        }

        eventProducer.publishCommitSynced(userId, syncedCount);
        return SyncResultDto.builder()
                .repositoriesSynced(syncedCount)
                .message("Sync completed")
                .build();
    }

    private void syncCommitStats(Repository repo, String githubUsername, String token) {
        int totalCommits = githubApiClient.fetchCommitCount(token, repo.getRepoFullName(), githubUsername, null);
        int last30 = githubApiClient.fetchCommitCount(token, repo.getRepoFullName(), githubUsername, isoDaysAgo(30));
        int last7 = githubApiClient.fetchCommitCount(token, repo.getRepoFullName(), githubUsername, isoDaysAgo(7));

        CommitStat stat = commitStatRepository.findByRepositoryIdAndIsDeletedFalse(repo.getId())
                .orElseGet(CommitStat::new);

        stat.setUserId(repo.getUserId());
        stat.setRepositoryId(repo.getId());
        stat.setTotalCommits(totalCommits);
        stat.setCommitsLast30Days(last30);
        stat.setCommitsLast7Days(last7);
        stat.setLastSyncedAt(LocalDateTime.now());
        stat.setIsDeleted(false);

        commitStatRepository.save(stat);
    }

    public GithubProfileResponseDto getProfile(UUID userId) {
        GithubProfile profile = githubProfileRepository.findByUserIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new GithubProfileNotFoundException("No GitHub profile connected for this user"));
        return toProfileDto(profile);
    }

    public List<RepositoryResponseDto> getRepositories(UUID userId) {
        return repositoryRepository.findByUserIdAndIsDeletedFalse(userId).stream()
                .map(this::toRepoDto)
                .collect(Collectors.toList());
    }

    public CommitStatResponseDto getCommitStats(UUID repositoryId) {
        CommitStat stat = commitStatRepository.findByRepositoryIdAndIsDeletedFalse(repositoryId)
                .orElseThrow(() -> new GithubProfileNotFoundException("No commit stats found for this repository"));
        return CommitStatResponseDto.builder()
                .totalCommits(stat.getTotalCommits())
                .commitsLast30Days(stat.getCommitsLast30Days())
                .commitsLast7Days(stat.getCommitsLast7Days())
                .lastCommitAt(stat.getLastCommitAt())
                .build();
    }

    private String isoDaysAgo(int days) {
        return LocalDateTime.now().minusDays(days).atOffset(ZoneOffset.UTC).format(DateTimeFormatter.ISO_INSTANT);
    }

    private LocalDateTime parseGithubDate(String githubTimestamp) {
        if (githubTimestamp == null) return null;
        try {
            return LocalDateTime.parse(githubTimestamp, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            return null;
        }
    }

    private GithubProfileResponseDto toProfileDto(GithubProfile p) {
        return GithubProfileResponseDto.builder()
                .githubUsername(p.getGithubUsername())
                .avatarUrl(p.getAvatarUrl())
                .bio(p.getBio())
                .publicReposCount(p.getPublicReposCount())
                .followersCount(p.getFollowersCount())
                .followingCount(p.getFollowingCount())
                .lastSyncedAt(p.getLastSyncedAt())
                .build();
    }

    private RepositoryResponseDto toRepoDto(Repository r) {
        return RepositoryResponseDto.builder()
                .id(r.getId())
                .repoName(r.getRepoName())
                .repoFullName(r.getRepoFullName())
                .repoUrl(r.getRepoUrl())
                .primaryLanguage(r.getPrimaryLanguage())
                .starsCount(r.getStarsCount())
                .forksCount(r.getForksCount())
                .isPrivate(r.getIsPrivate())
                .isForked(r.getIsForked())
                .lastPushedAt(r.getLastPushedAt())
                .build();
    }
}