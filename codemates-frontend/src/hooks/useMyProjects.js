/**
 * src/hooks/useMyProjects.js
 *
 * React Query hooks for project data.
 * Calls the real Spring Boot API — no mock layer.
 *
 * Cache key structure:
 *   ['projects', 'my']          → the current user's project list
 *   ['projects', id]            → a single project
 *   ['projects', id, 'members'] → a project's member list
 *
 * Invalidating ['projects', 'my'] (e.g. after createProject) automatically
 * refreshes the My Projects list without touching individual project caches.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as projectApi from '../api/projectApi';

// ── List: my projects ─────────────────────────────────────────────────────────

/**
 * Fetch all projects the current user owns or has joined.
 *
 * Usage:
 *   const { projects, isLoading, isError, error, refetch } = useMyProjects();
 */
export function useMyProjects() {
  const query = useQuery({
    queryKey:  ['projects', 'my'],
    queryFn:   projectApi.getMyProjects,
    staleTime: 1000 * 60 * 5,
    retry:     2,
    refetchOnWindowFocus: false,
  });

  return {
    projects:  query.data ?? [],
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error,
    refetch:   query.refetch,
  };
}

// ── Single project ────────────────────────────────────────────────────────────

/**
 * Fetch a single project by ID.
 * Safe to call before projectId resolves (query is disabled when falsy).
 *
 * Usage:
 *   const { project, isLoading, isError } = useProject(projectId);
 */
export function useProject(projectId) {
  const query = useQuery({
    queryKey:  ['projects', projectId],
    queryFn:   () => projectApi.getProject(projectId),
    enabled:   !!projectId,
    staleTime: 1000 * 60 * 5,
    retry:     2,
    refetchOnWindowFocus: false,
  });

  return {
    project:   query.data ?? null,
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error,
    refetch:   query.refetch,
  };
}

// ── Project members ───────────────────────────────────────────────────────────

/**
 * Fetch the member list for a project.
 *
 * Returns ProjectMemberResponseDto[]: { id, projectId, userId, role, joinedAt, invitedByUserId }
 * Display names / avatars are not included — those require a user-service call.
 *
 * Usage:
 *   const { members, isLoading } = useProjectMembers(projectId);
 */
export function useProjectMembers(projectId) {
  const query = useQuery({
    queryKey:  ['projects', projectId, 'members'],
    queryFn:   () => projectApi.getProjectMembers(projectId),
    enabled:   !!projectId,
    staleTime: 1000 * 60 * 5,
    retry:     2,
  });

  return {
    members:   query.data ?? [],
    isLoading: query.isLoading,
    isError:   query.isError,
  };
}

// ── Pending invitations ───────────────────────────────────────────────────────

/**
 * Fetch all pending invitations for the current user.
 *
 * Usage:
 *   const { invitations, isLoading } = usePendingInvitations();
 */
export function usePendingInvitations() {
  const query = useQuery({
    queryKey:  ['invitations', 'pending'],
    queryFn:   projectApi.getPendingInvitations,
    staleTime: 1000 * 60 * 2,
    retry:     2,
  });

  return {
    invitations: query.data ?? [],
    isLoading:   query.isLoading,
    isError:     query.isError,
  };
}

// ── Mutations ─────────────────────────────────────────────────────────────────

/**
 * Create, update, and delete project mutations.
 * Each invalidates the relevant cache keys on success.
 *
 * Usage:
 *   const { createProject, updateProject, deleteProject, isSubmitting } =
 *     useProjectMutations();
 */
export function useProjectMutations() {
  const queryClient = useQueryClient();

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: ['projects', 'my'] });

  const invalidateProject = (projectId) =>
    queryClient.invalidateQueries({ queryKey: ['projects', projectId] });

  // ── Create ──────────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: projectApi.createProject,
    onSuccess:  invalidateList,
  });

  // ── Update ──────────────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ projectId, data }) => projectApi.updateProject(projectId, data),
    onSuccess: (updated) => {
      // Update single-project cache immediately; refresh the list too
      queryClient.setQueryData(['projects', updated.id], updated);
      invalidateList();
    },
  });

  // ── Delete ──────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: projectApi.deleteProject,
    onSuccess: (_, projectId) => {
      queryClient.removeQueries({ queryKey: ['projects', projectId] });
      invalidateList();
    },
  });

  // ── Invitation: accept ───────────────────────────────────────────────────────
  const acceptMutation = useMutation({
    mutationFn: projectApi.acceptInvitation,
    onSuccess: () => {
      // Refresh both the pending list and the user's project list
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
      invalidateList();
    },
  });

  // ── Invitation: reject ───────────────────────────────────────────────────────
  const rejectMutation = useMutation({
    mutationFn: projectApi.rejectInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations', 'pending'] });
    },
  });

  return {
    createProject:   createMutation.mutate,
    updateProject:   updateMutation.mutate,   // { projectId, data }
    deleteProject:   deleteMutation.mutate,   // projectId
    acceptInvitation: acceptMutation.mutate,  // invitationId
    rejectInvitation: rejectMutation.mutate,  // invitationId

    isSubmitting:
      createMutation.isPending ||
      updateMutation.isPending ||
      deleteMutation.isPending,

    createError: createMutation.error,
    updateError: updateMutation.error,
  };
}