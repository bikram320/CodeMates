/**
 * useProjectGitHub(projectId)
 *
 * Data layer for the Project GitHub page (TanStack Query):
 *   ProjectGitHub.jsx → useProjectGitHub → githubApi.js → githubMock.js (for now)
 *
 * Requires a <QueryClientProvider> higher up the tree.
 *
 * The repository query runs first. Only when a repository is connected do the
 * stats / commits / activity queries run (the real endpoints need the
 * repository id, and a disconnected project has nothing to fetch).
 *
 * Returns
 *   repository, stats, dailyCommits, recentCommits, recentActivity
 *                     undefined until loaded (repository is null when disconnected)
 *   connected         a repository is linked to the project
 *   canManage         viewer may connect / disconnect
 *   isLoading         the page can't show real content yet
 *   isError / error   loading failed and there's nothing to show
 *   refetch           () => Promise   retries whatever failed
 *   connectRepository()     → Promise (rejects with GitHubApiError)
 *   disconnectRepository()  → Promise (updates instantly, rolls back on error)
 *   isConnecting            connect request in flight
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  canManageRepository,
  connectRepository as connectRepositoryApi,
  disconnectRepository as disconnectRepositoryApi,
  getCommitActivity,
  getProjectRepository,
  getRepositoryActivity,
  getRepositoryStats,
} from '../api/githubApi';

const keyBase = (projectId) => ['projects', projectId, 'github'];

export const githubQueryKeys = {
  all: keyBase,
  repository: (projectId) => [...keyBase(projectId), 'repository'],
  stats: (projectId) => [...keyBase(projectId), 'stats'],
  commits: (projectId) => [...keyBase(projectId), 'commits'],
  activity: (projectId) => [...keyBase(projectId), 'activity'],
};

// Don't retry 4xx (not found / forbidden); retry a flaky 5xx once.
const retry = (failureCount, error) =>
  (!error?.status || error.status >= 500) && failureCount < 1;

// Mutation status names differ between TanStack Query v4 ('loading') and v5 ('pending').
const isRunning = (mutation) =>
  mutation.status === 'pending' || mutation.status === 'loading';

export function useProjectGitHub(projectId) {
  const queryClient = useQueryClient();
  const enabled = Boolean(projectId);
  const repositoryKey = githubQueryKeys.repository(projectId);

  /* ── Queries ─────────────────────────────────────────────────────────── */

  const repositoryQuery = useQuery({
    queryKey: repositoryKey,
    queryFn: () => getProjectRepository(projectId),
    enabled,
    retry,
  });

  const repository = repositoryQuery.data ?? null;
  const connected = repository !== null;
  const detailsEnabled = enabled && connected;

  const statsQuery = useQuery({
    queryKey: githubQueryKeys.stats(projectId),
    queryFn: () => getRepositoryStats(projectId),
    enabled: detailsEnabled,
    retry,
  });
  const commitsQuery = useQuery({
    queryKey: githubQueryKeys.commits(projectId),
    queryFn: () => getCommitActivity(projectId),
    enabled: detailsEnabled,
    retry,
  });
  const activityQuery = useQuery({
    queryKey: githubQueryKeys.activity(projectId),
    queryFn: () => getRepositoryActivity(projectId),
    enabled: detailsEnabled,
    retry,
  });

  /* ── Derived state ───────────────────────────────────────────────────── */

  const detailQueries = [statsQuery, commitsQuery, activityQuery];
  const detailsReady = detailQueries.every((q) => q.data !== undefined);
  const detailsFailed = detailQueries.find(
    (q) => q.isError && q.data === undefined
  );

  const repositoryLoading =
    enabled && repositoryQuery.data === undefined && !repositoryQuery.isError;
  const repositoryFailed =
    repositoryQuery.isError && repositoryQuery.data === undefined;

  const isLoading =
    repositoryLoading || (connected && !detailsReady && !detailsFailed);
  const isError = repositoryFailed || Boolean(detailsFailed);
  const error = repositoryQuery.error ?? detailsFailed?.error ?? null;

  const refetch = () =>
    Promise.all([
      repositoryQuery.refetch(),
      ...(connected ? detailQueries.map((q) => q.refetch()) : []),
    ]);

  /* ── Mutations ───────────────────────────────────────────────────────── */

  const invalidateAll = () =>
    queryClient.invalidateQueries({ queryKey: githubQueryKeys.all(projectId) });

  const connect = useMutation({
    mutationFn: () => connectRepositoryApi(projectId),
    onSuccess: (connectedRepository) =>
      queryClient.setQueryData(repositoryKey, connectedRepository),
    onSettled: invalidateAll,
  });

  // Optimistic: flip to "not connected" immediately, roll back if it fails.
  const disconnect = useMutation({
    mutationFn: () => disconnectRepositoryApi(projectId),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: githubQueryKeys.all(projectId) });
      const previous = queryClient.getQueryData(repositoryKey);
      queryClient.setQueryData(repositoryKey, null);
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context) queryClient.setQueryData(repositoryKey, context.previous);
    },
    onSettled: invalidateAll,
  });

  const recentCommitActivity = commitsQuery.data;

  return {
    repository: repositoryQuery.data,
    stats: statsQuery.data,
    dailyCommits: recentCommitActivity?.dailyCommits,
    recentCommits: recentCommitActivity?.recentCommits,
    recentActivity: activityQuery.data,

    connected,
    canManage: canManageRepository(projectId),

    isLoading,
    isError,
    error,
    refetch,

    connectRepository: () => connect.mutateAsync(),
    disconnectRepository: () => disconnect.mutateAsync(),
    isConnecting: isRunning(connect),
  };
}

export default useProjectGitHub;