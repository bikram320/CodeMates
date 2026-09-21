/**
 * useProjectSettings(projectId)
 *
 * Data layer for the Project Settings page (TanStack Query):
 *   ProjectSettings.jsx → useProjectSettings → projectSettingsApi.js → projectSettingsMock.js
 *
 * Requires a <QueryClientProvider> higher up the tree.
 *
 * Returns
 *   general, repository, team     undefined until loaded
 *   status                        'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
 *   memberCount, pendingInviteCount
 *   canManage                     viewer is a project leader
 *   isLoading                     first load in flight
 *   isEmpty                       no such project (never existed, or was deleted)
 *   isError / error               loading failed and there's nothing to show
 *   refetch                       () => Promise
 *   updateProjectSettings(settings)        → Promise (rejects with ProjectSettingsApiError)
 *   updateRepositorySettings(repositoryData)  ({ repoUrl }; '' disconnects)
 *   updateTeamSettings(teamSettings)
 *   archiveProject() / unarchiveProject()
 *   deleteProject()               → Promise; afterwards isEmpty becomes true
 *
 * Saves are optimistic: the cached value changes immediately (so the form
 * isn't left "dirty" while the request is in flight) and only that section is
 * rolled back if the request fails. The page's own form keeps what the user
 * typed, so they can fix it and try again.
 *
 * Deleting is NOT optimistic — the UI waits for the server. The confirmation
 * (typing the project name) happens in the page before this is called.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  archiveProject as archiveProjectApi,
  deleteProject as deleteProjectApi,
  getProjectSettings,
  unarchiveProject as unarchiveProjectApi,
  updateProjectSettings as updateProjectSettingsApi,
  updateRepositorySettings as updateRepositorySettingsApi,
  updateTeamSettings as updateTeamSettingsApi,
} from '../api/projectSettingsApi';

export const projectSettingsQueryKey = (projectId) => ['projects', projectId, 'settings'];

// Don't retry 4xx; retry a flaky 5xx once.
const retry = (failureCount, error) =>
  (!error?.status || error.status >= 500) && failureCount < 1;

// How to read / write each piece of the cached settings.
const SLICES = {
  general: {
    read: (d) => d.general,
    write: (d, value) => ({ ...d, general: value }),
  },
  repository: {
    read: (d) => d.repository,
    write: (d, value) => ({ ...d, repository: value }),
  },
  team: {
    read: (d) => d.team,
    write: (d, value) => ({ ...d, team: value }),
  },
  status: {
    read: (d) => d.project.status,
    write: (d, value) => ({ ...d, project: { ...d.project, status: value } }),
  },
};

/**
 * A mutation that updates one slice of the cached settings optimistically.
 * `optimistic(currentSlice, variables)` returns the slice as it should look
 * once the save succeeds.
 */
function useSliceMutation(queryClient, queryKey, { slice, mutationFn, optimistic }) {
  const { read, write } = SLICES[slice];

  const patch = (updater) =>
    queryClient.setQueryData(queryKey, (current) =>
      current ? write(current, updater(read(current))) : current
    );

  return useMutation({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });
      const data = queryClient.getQueryData(queryKey);
      const previous = data ? read(data) : undefined;
      patch((current) => optimistic(current, variables));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous !== undefined) patch(() => context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

export function useProjectSettings(projectId) {
  const queryClient = useQueryClient();
  const queryKey = projectSettingsQueryKey(projectId);
  const enabled = Boolean(projectId);

  const query = useQuery({
    queryKey,
    queryFn: () => getProjectSettings(projectId),
    enabled,
    retry,
  });

  /* ── Mutations ───────────────────────────────────────────────────────── */

  const general = useSliceMutation(queryClient, queryKey, {
    slice: 'general',
    mutationFn: (settings) => updateProjectSettingsApi(projectId, settings),
    optimistic: (current, settings) => ({ ...current, ...settings }),
  });

  const repository = useSliceMutation(queryClient, queryKey, {
    slice: 'repository',
    mutationFn: (repositoryData) => updateRepositorySettingsApi(projectId, repositoryData),
    // The server fills in the details; until it answers, show what we know.
    optimistic: (current, { repoUrl }) =>
      repoUrl
        ? { ...current, connected: true, repoUrl, lastSyncedAt: new Date().toISOString() }
        : { connected: false, repoUrl: '', isPrivate: false, lastSyncedAt: null, connectedBy: null },
  });

  const team = useSliceMutation(queryClient, queryKey, {
    slice: 'team',
    mutationFn: (teamSettings) => updateTeamSettingsApi(projectId, teamSettings),
    optimistic: (current, teamSettings) => ({ ...current, ...teamSettings }),
  });

  const archive = useSliceMutation(queryClient, queryKey, {
    slice: 'status',
    mutationFn: () => archiveProjectApi(projectId),
    optimistic: () => 'ARCHIVED',
  });

  const unarchive = useSliceMutation(queryClient, queryKey, {
    slice: 'status',
    mutationFn: () => unarchiveProjectApi(projectId),
    optimistic: () => 'ACTIVE',
  });

  // Not optimistic: wait for the server, then the project is simply gone.
  const remove = useMutation({
    mutationFn: () => deleteProjectApi(projectId),
    onSuccess: () => queryClient.setQueryData(queryKey, null),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const data = query.data; // undefined = loading, null = no such project, object = loaded

  return {
    general: data?.general,
    repository: data?.repository,
    team: data?.team,
    status: data?.project?.status,
    memberCount: data?.project?.memberCount,
    pendingInviteCount: data?.project?.pendingInviteCount,
    canManage: data?.permissions?.canManage,

    isLoading: enabled && data === undefined && !query.isError,
    isEmpty: data === null || (!enabled && data === undefined),
    isError: query.isError && data === undefined,
    error: query.error ?? null,
    refetch: query.refetch,

    updateProjectSettings: (settings) => general.mutateAsync(settings),
    updateRepositorySettings: (repositoryData) => repository.mutateAsync(repositoryData),
    updateTeamSettings: (teamSettings) => team.mutateAsync(teamSettings),
    archiveProject: () => archive.mutateAsync(),
    unarchiveProject: () => unarchive.mutateAsync(),
    deleteProject: () => remove.mutateAsync(),
  };
}

export default useProjectSettings;