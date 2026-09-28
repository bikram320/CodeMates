import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getProjectMembers,
  inviteMember as inviteMemberApi,
  removeMember as removeMemberApi,
  changeMemberRole as changeMemberRoleApi,
  getJoinRequests as getJoinRequestsApi,
  acceptJoinRequest as acceptJoinRequestApi,
  rejectJoinRequest as rejectJoinRequestApi,
} from '../api/projectApi';
import useAuth from './useAuth';

export const teamKeys = {
  team: (projectId) => ['project-team', projectId],
  joinRequests: (projectId) => ['project-team', projectId, 'join-requests'],
};

/**
 * Hook backing the Project Team page.
 *
 * Adds join-request handling (Part C) alongside the existing
 * invite/remove/change-role mutations. The join-requests list is only
 * fetched for the viewer if they're already resolved as LEADER from the
 * members list — GET .../join-requests 403s for non-leaders server-side,
 * so this avoids every non-leader eating a failed request on page load.
 */
export default function useProjectTeam(projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const currentUserId = user?.id ?? user?.userId ?? null;

  const membersQuery = useQuery({
    queryKey: teamKeys.team(projectId),
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
  });

  const isLeader =
      membersQuery.data?.find((m) => m.userId === currentUserId)?.role === 'LEADER';

  const joinRequestsQuery = useQuery({
    queryKey: teamKeys.joinRequests(projectId),
    queryFn: () => getJoinRequestsApi(projectId),
    enabled: !!projectId && isLeader,
  });

  const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: teamKeys.team(projectId) });

  const invalidateJoinRequests = () =>
      queryClient.invalidateQueries({ queryKey: teamKeys.joinRequests(projectId) });

  const inviteMutation = useMutation({
    mutationFn: ({ invitedUserId, role }) =>
        inviteMemberApi(projectId, { invitedUserId, role }),
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: (memberUserId) => removeMemberApi(projectId, memberUserId),
    onSuccess: invalidate,
  });

  const changeRoleMutation = useMutation({
    mutationFn: ({ memberUserId, role }) =>
        changeMemberRoleApi(projectId, memberUserId, role),
    onSuccess: invalidate,
  });

  const acceptJoinRequestMutation = useMutation({
    mutationFn: (joinRequestId) => acceptJoinRequestApi(joinRequestId),
    onSuccess: () => {
      invalidate(); // the accepted requester now shows up in the roster
      invalidateJoinRequests();
    },
  });

  const rejectJoinRequestMutation = useMutation({
    mutationFn: (joinRequestId) => rejectJoinRequestApi(joinRequestId),
    onSuccess: invalidateJoinRequests,
  });

  return {
    members: membersQuery.data ?? [],
    pendingInvites: [], // see original note — no per-project sent-invites endpoint
    joinRequests: joinRequestsQuery.data ?? [],
    isLoadingJoinRequests: joinRequestsQuery.isLoading,
    currentUserId,
    isLoading: membersQuery.isLoading,
    isError: membersQuery.isError,
    error: membersQuery.error,
    refetch: membersQuery.refetch,
    inviteMember: (invitedUserId, role) =>
        inviteMutation.mutateAsync({ invitedUserId, role }),
    removeMember: (memberUserId) => removeMutation.mutateAsync(memberUserId),
    changeMemberRole: (memberUserId, role) =>
        changeRoleMutation.mutateAsync({ memberUserId, role }),
    acceptJoinRequest: (joinRequestId) =>
        acceptJoinRequestMutation.mutateAsync(joinRequestId),
    rejectJoinRequest: (joinRequestId) =>
        rejectJoinRequestMutation.mutateAsync(joinRequestId),
  };
}