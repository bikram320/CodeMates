/**
 * useGithub() / useRepositoryCommitStats(repositoryId)
 *
 * Data layer for the GitHub Integration page (TanStack Query), talking to the
 * real github-sync-service backend:
 *   GitHubIntegration.jsx → useGithub → githubApi.js → github-sync-service
 *
 * Requires a <QueryClientProvider> higher up the tree.
 *
 * useGithub() returns
 *   profile                 GithubProfileResponseDto, or undefined while loading
 *   isLoadingProfile         first load of the profile in flight
 *   isNotConnected           loaded, and there's no GitHub account connected yet
 *   profileError             error | null — a real failure (not "not connected")
 *   refetchProfile()
 *
 *   repositories             RepositoryResponseDto[], undefined until loaded
 *   isLoadingRepositories
 *   repositoriesError        error | null
 *   refetchRepositories()
 *
 *   connect(accessToken)     → Promise<GithubProfileResponseDto> (rejects with GithubApiError)
 *   isConnecting
 *   connectError              error | null — kept around so the connect form can show it inline
 *
 *   sync()                   → Promise<SyncResultDto>
 *   isSyncing
 *
 * useRepositoryCommitStats(repositoryId) is a separate hook (not part of
 * useGithub's return value) so a repository's commit stats are only fetched
 * once its card is expanded — call it with `enabled` controlled by the
 * component, or just call it only while the card is open.
 *   { data, isLoading, isError, error, refetch }
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  connectGithub,
  getGithubProfile,
  getGithubRepositories,
  getRepositoryCommitStats,
  isNotConnectedError,
  syncGithub,
} from '../api/githubApi';

export const githubQueryKeys = {
  profile: ['github', 'profile'],
  repositories: ['github', 'repositories'],
  commitStats: (repositoryId) => ['github', 'commit-stats', repositoryId],
};

// Mutation status names differ between TanStack Query v4 ('loading') and v5 ('pending').
const isMutating = (mutation) => mutation.status === 'pending' || mutation.status === 'loading';

// Don't retry 4xx (including "not connected"); retry a flaky 5xx/network error once.
const retryServerErrorsOnly = (failureCount, error) =>
  (!error?.status || error.status >= 500) && failureCount < 1;

export function useGithub() {
  const queryClient = useQueryClient();

  const profileQuery = useQuery({
    queryKey: githubQueryKeys.profile,
    queryFn: getGithubProfile,
    retry: (count, error) => !isNotConnectedError(error) && retryServerErrorsOnly(count, error),
  });

  const notConnected = isNotConnectedError(profileQuery.error);
  const connected = profileQuery.data !== undefined;

  const repositoriesQuery = useQuery({
    queryKey: githubQueryKeys.repositories,
    queryFn: getGithubRepositories,
    enabled: connected,
    retry: retryServerErrorsOnly,
  });

  const connectMutation = useMutation({
    mutationFn: (accessToken) => connectGithub(accessToken),
    onSuccess: (profile) => {
      queryClient.setQueryData(githubQueryKeys.profile, profile);
      queryClient.invalidateQueries({ queryKey: githubQueryKeys.repositories });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => syncGithub(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: githubQueryKeys.profile });
      queryClient.invalidateQueries({ queryKey: githubQueryKeys.repositories });
    },
  });

  return {
    profile: profileQuery.data,
    isLoadingProfile: profileQuery.data === undefined && !profileQuery.isError,
    isNotConnected: notConnected,
    profileError: !notConnected && profileQuery.isError ? profileQuery.error : null,
    refetchProfile: profileQuery.refetch,

    repositories: repositoriesQuery.data,
    isLoadingRepositories: connected && repositoriesQuery.data === undefined && !repositoriesQuery.isError,
    repositoriesError: repositoriesQuery.isError ? repositoriesQuery.error : null,
    refetchRepositories: repositoriesQuery.refetch,

    connect: (accessToken) => connectMutation.mutateAsync(accessToken),
    isConnecting: isMutating(connectMutation),
    connectError: connectMutation.error,

    sync: () => syncMutation.mutateAsync(),
    isSyncing: isMutating(syncMutation),
  };
}

export function useRepositoryCommitStats(repositoryId, { enabled = true } = {}) {
  return useQuery({
    queryKey: githubQueryKeys.commitStats(repositoryId),
    queryFn: () => getRepositoryCommitStats(repositoryId),
    enabled: Boolean(repositoryId) && enabled,
    retry: retryServerErrorsOnly,
  });
}

export default useGithub;