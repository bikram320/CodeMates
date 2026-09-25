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
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
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
        profile.setPublicGistsCount(apiUser.getPublicGists());
        profile.setAccountCreatedAt(parseGithubDate(apiUser.getCreatedAt()));
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
        profile.setPublicGistsCount(apiUser.getPublicGists());
        profile.setAccountCreatedAt(parseGithubDate(apiUser.getCreatedAt()));
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
            repo.setOpenIssuesCount(apiRepo.getOpenIssuesCount());
            repo.setSizeKb(apiRepo.getSize());
            repo.setLicense(apiRepo.getLicense() != null ? apiRepo.getLicense().getName() : null);
            repo.setRepoCreatedAt(parseGithubDate(apiRepo.getCreatedAt()));
            repo.setTopics(apiRepo.getTopics() != null && !apiRepo.getTopics().isEmpty()
                    ? String.join(",", apiRepo.getTopics()) : null);
            repo.setLastSyncedAt(LocalDateTime.now());
            repo.setIsDeleted(false);

            Repository savedRepo = repositoryRepository.save(repo);
            syncCommitStats(savedRepo, profile.getGithubUsername(), token);
            int contributors = githubApiClient.fetchContributorsCount(token, savedRepo.getRepoFullName());
            savedRepo.setContributorsCount(contributors);
            repositoryRepository.save(savedRepo);
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

    /**
     * Internal lookup used by project-service's health-prediction sync job.
     * repoFullName format: "owner/repo" (matches GitHub's own fullName field).
     */
    public RepoHealthStatsDto getRepoStatsForHealth(String repoFullName) {
        Repository repo = repositoryRepository.findByRepoFullNameAndIsDeletedFalse(repoFullName)
                .orElseThrow(() -> new GithubProfileNotFoundException("No synced data for repo: " + repoFullName));

        int ageDays = repo.getRepoCreatedAt() != null
                ? (int) java.time.temporal.ChronoUnit.DAYS.between(repo.getRepoCreatedAt(), LocalDateTime.now())
                : 0;

        return RepoHealthStatsDto.builder()
                .repoFullName(repo.getRepoFullName())
                .stars(repo.getStarsCount())
                .forks(repo.getForksCount())
                .openIssues(repo.getOpenIssuesCount())
                .contributors(repo.getContributorsCount())
                .sizeKb(repo.getSizeKb())
                .projectAgeDays(ageDays)
                .language(repo.getPrimaryLanguage())
                .license(repo.getLicense())
                .build();
    }

    /**
     * Internal lookup used by discovery-service's match-sync job.
     * Builds a skill profile from every repo this user has contributed to:
     * languages used, topics used, and their single most-frequent language.
     */
    public DeveloperSkillProfileDto getDeveloperSkillProfile(UUID userId) {
        GithubProfile profile = githubProfileRepository.findByUserIdAndIsDeletedFalse(userId)
                .orElseThrow(() -> new GithubProfileNotFoundException("No GitHub profile connected for user: " + userId));

        List<Repository> repos = repositoryRepository.findByUserIdAndIsDeletedFalse(userId);

        Set<String> languages = repos.stream()
                .map(Repository::getPrimaryLanguage)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Set<String> topics = repos.stream()
                .map(Repository::getTopics)
                .filter(Objects::nonNull)
                .flatMap(t -> Arrays.stream(t.split(",")))
                .map(String::trim)
                .filter(t -> !t.isEmpty())
                .collect(Collectors.toSet());

        String primaryLanguage = repos.stream()
                .map(Repository::getPrimaryLanguage)
                .filter(Objects::nonNull)
                .collect(Collectors.groupingBy(l -> l, Collectors.counting()))
                .entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse(null);

        int accountAgeDays = profile.getAccountCreatedAt() != null
                ? (int) java.time.temporal.ChronoUnit.DAYS.between(profile.getAccountCreatedAt(), LocalDateTime.now())
                : 0;

        return DeveloperSkillProfileDto.builder()
                .userId(userId.toString())
                .languages(new ArrayList<>(languages))
                .topics(new ArrayList<>(topics))
                .primaryLanguage(primaryLanguage)
                .publicRepos(profile.getPublicReposCount())
                .publicGists(profile.getPublicGistsCount())
                .followers(profile.getFollowersCount())
                .following(profile.getFollowingCount())
                .accountAgeDays(accountAgeDays)
                .build();
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
