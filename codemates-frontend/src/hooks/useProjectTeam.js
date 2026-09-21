/**
 * useProjectTeam(projectId)
 *
 * Data layer for the Project Team page (TanStack Query):
 *   ProjectTeam.jsx → useProjectTeam → teamApi.js → teamMock.js (for now)
 *
 * Requires a <QueryClientProvider> higher up the tree.
 *
 * Returns
 *   members         ACTIVE members
 *   pendingInvites  PENDING invitees (not shown as cards)
 *   currentUserId   signed-in user's id
 *   isLoading       first load in flight
 *   isFetching      any fetch in flight (includes background refetches)
 *   isError         load failed and there's nothing cached to show
 *   error           TeamApiError | null
 *   refetch         () => Promise
 *   inviteMember(memberId, role)      → Promise (rejects with TeamApiError)
 *   removeMember(memberId)            → Promise
 *   changeMemberRole(memberId, role)  → Promise
 *
 * After every mutation — success or failure — the team query is invalidated,
 * so the list always ends up matching the server.
 */

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  getCurrentUserId,
  getProjectTeam,
  inviteMember as inviteMemberApi,
  removeMember as removeMemberApi,
  updateMemberRole as updateMemberRoleApi,
} from '../api/teamApi';

export const teamQueryKey = (projectId) => ['projects', projectId, 'team'];

export function useProjectTeam(projectId) {
  const queryClient = useQueryClient();
  const queryKey = teamQueryKey(projectId);

  const query = useQuery({
    queryKey,
    queryFn: () => getProjectTeam(projectId),
    enabled: Boolean(projectId),
    // Don't retry 4xx (not found / forbidden); retry a flaky 5xx once.
    retry: (failureCount, error) =>
      (!error?.status || error.status >= 500) && failureCount < 1,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const invite = useMutation({
    mutationFn: ({ memberId, role }) =>
      inviteMemberApi(projectId, memberId, role),
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: (memberId) => removeMemberApi(projectId, memberId),
    onSettled: invalidate,
  });

  const changeRole = useMutation({
    mutationFn: ({ memberId, role }) =>
      updateMemberRoleApi(projectId, memberId, role),
    onSettled: invalidate,
  });

  const members = useMemo(
    () => (query.data ?? []).filter((m) => m.status === 'ACTIVE'),
    [query.data]
  );
  const pendingInvites = useMemo(
    () => (query.data ?? []).filter((m) => m.status === 'PENDING'),
    [query.data]
  );

  return {
    members,
    pendingInvites,
    currentUserId: getCurrentUserId(),

    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError && query.data === undefined,
    error: query.error ?? null,
    refetch: query.refetch,

    inviteMember: (memberId, role) => invite.mutateAsync({ memberId, role }),
    removeMember: (memberId) => remove.mutateAsync(memberId),
    changeMemberRole: (memberId, role) =>
      changeRole.mutateAsync({ memberId, role }),
  };
}

export default useProjectTeam;