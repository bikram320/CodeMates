import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getProjectMembers,
  inviteMember as inviteMemberApi,
  removeMember as removeMemberApi,
  changeMemberRole as changeMemberRoleApi,
} from '../api/projectApi';
import useAuth from './useAuth';

export const teamKeys = {
  team: (projectId) => ['project-team', projectId],
};

/**
 * Hook backing the Project Team page.
 *
 * Replaces the old mock `teamApi.js` — this calls projectApi.js's real
 * endpoints directly, since ProjectResourceController-style hydration
 * (mapping userId → name/skills/availability) has no backend support
 * yet (see the removed teamApi.js's own comments: profiles are only
 * looked up by username, not by userId).
 *
 * `pendingInvites` is always empty: the only invitations endpoint is
 * GET /api/projects/invitations/pending, which returns invites
 * addressed to the *current* user across all their projects, not
 * "invites this project has sent out." There's no per-project pending
 * list to show here.
 */
export default function useProjectTeam(projectId) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // NOTE: exact field name on the auth user object is unverified (no
  // authApi.js / UserInfoResponse shape was available). Adjust this if
  // the real field differs.
  const currentUserId = user?.id ?? user?.userId ?? null;

  const membersQuery = useQuery({
    queryKey: teamKeys.team(projectId),
    queryFn: () => getProjectMembers(projectId),
    enabled: !!projectId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: teamKeys.team(projectId) });

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

  return {
    members: membersQuery.data ?? [],
    pendingInvites: [], // see note above — no backend support for this
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
  };
}