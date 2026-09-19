/**
 * src/hooks/useTasks.js
 *
 * React Query hook for project task data.
 *
 * Data flow:
 *   ProjectTasks.jsx
 *     → useTasks(projectId)
 *       → taskApi.getTasks / createTask / updateTask / deleteTask
 *         → mock (VITE_USE_MOCK=true) or real Spring Boot (VITE_USE_MOCK=false)
 *
 * All three mutations use optimistic updates so the Kanban board feels instant:
 *   1. onMutate  — update the React Query cache immediately (no flicker)
 *   2. onError   — roll back to the previous cache snapshot if the call fails
 *   3. onSuccess — replace the optimistic placeholder with the real server response
 *
 * Usage:
 *   const {
 *     tasks, isLoading, isError, error, refetch,
 *     createTask, updateTask, deleteTask,
 *     isCreating, isUpdating, isDeleting,
 *   } = useTasks(projectId);
 *
 *   createTask(data)                      // data = CreateTaskRequest fields
 *   updateTask({ taskId, data })          // data can include status
 *   deleteTask(taskId)
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as taskApi from '../api/taskApi';

export function useTasks(projectId) {
  const queryClient = useQueryClient();

  // Unique cache key per project — React Query uses this for cache lookup and invalidation
  const queryKey = ['tasks', projectId];

  // ── Query ───────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey,
    queryFn:  () => taskApi.getTasks(projectId),
    enabled:  !!projectId,          // don't fetch if projectId is missing
    staleTime: 1000 * 60 * 2,       // treat data as fresh for 2 minutes
    retry: 2,
  });

  // ── Create mutation ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: (data) => taskApi.createTask(projectId, data),

    onMutate: async (data) => {
      // Cancel any in-flight refetch so it doesn't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Save current cache for rollback
      const previous = queryClient.getQueryData(queryKey);

      // Add a temporary placeholder task immediately
      const optimisticTask = {
        id:               `optimistic-${Date.now()}`,
        projectId:        projectId ?? '',
        createdByUserId:  'user-uuid-001',
        assignedToUserId: data.assignedToUserId ?? null,
        title:            data.title,
        description:      data.description ?? '',
        status:           'TODO',   // always TODO — mirrors the API rule
        priority:         data.priority ?? 'MEDIUM',
        dueDate:          data.dueDate ?? null,
        completedAt:      null,
        position:         (previous ?? []).filter((t) => t.status === 'TODO').length,
        createdAt:        new Date().toISOString(),
        updatedAt:        new Date().toISOString(),
        _optimistic:      true,     // flag so we can identify and replace it on success
      };

      queryClient.setQueryData(queryKey, (old) => [...(old ?? []), optimisticTask]);

      return { previous, optimisticId: optimisticTask.id };
    },

    onError: (_, __, context) => {
      // Roll back the cache to the snapshot taken before the mutation started
      queryClient.setQueryData(queryKey, context.previous);
    },

    onSuccess: (newTask, _, context) => {
      // Replace the optimistic placeholder with the real server response
      queryClient.setQueryData(queryKey, (old) =>
        (old ?? []).map((t) => (t.id === context.optimisticId ? newTask : t))
      );
    },
  });

  // ── Update mutation ─────────────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: ({ taskId, data }) => taskApi.updateTask(projectId, taskId, data),

    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      // Immediately apply the update to the cache
      queryClient.setQueryData(queryKey, (old) =>
        (old ?? []).map((t) =>
          t.id === taskId
            ? { ...t, ...data, updatedAt: new Date().toISOString() }
            : t
        )
      );

      return { previous };
    },

    onError: (_, __, context) => {
      queryClient.setQueryData(queryKey, context.previous);
    },

    onSuccess: (updatedTask) => {
      // Replace the optimistic version with the real server response
      queryClient.setQueryData(queryKey, (old) =>
        (old ?? []).map((t) => (t.id === updatedTask.id ? updatedTask : t))
      );
    },
  });

  // ── Delete mutation ─────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (taskId) => taskApi.deleteTask(projectId, taskId),

    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      // Remove the task from the cache immediately
      queryClient.setQueryData(queryKey, (old) =>
        (old ?? []).filter((t) => t.id !== taskId)
      );

      return { previous };
    },

    onError: (_, __, context) => {
      queryClient.setQueryData(queryKey, context.previous);
    },

    // No onSuccess needed — the task is already removed from the cache
  });

  // ── Public interface ─────────────────────────────────────────────────────────
  return {
    // Query state
    tasks:     query.data ?? [],
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error,
    refetch:   query.refetch,

    // Mutations — call these directly with the required arguments
    createTask: createMutation.mutate,   // (data) => void
    updateTask: updateMutation.mutate,   // ({ taskId, data }) => void
    deleteTask: deleteMutation.mutate,   // (taskId) => void

    // Pending states — useful for disabling buttons or showing spinners
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}