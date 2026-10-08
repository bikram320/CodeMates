/**
 * src/hooks/useTasks.js
 *
 * React Query hooks for project tasks.
 * Wired directly to the real Spring Boot API — no mock.
 *
 * Two separate mutations match the two distinct backend endpoints:
 *
 *   updateTask({ taskId, data })
 *     → PUT /api/projects/{projectId}/tasks/{taskId}
 *     → Fields only: title, description, assignedToUserId, priority, dueDate
 *     → NEVER send status here
 *
 *   changeStatus({ taskId, status, position? })
 *     → PUT /api/projects/{projectId}/tasks/{taskId}/status
 *     → Status only: TODO | IN_PROGRESS | REVIEW | DONE
 *
 * ProjectTasks.jsx calls them independently based on what changed in the form,
 * and — because both target the same task — they can be in flight at the
 * same time. Both use optimistic updates so the board feels instant.
 *
 * IMPORTANT — why onSuccess here does a narrow merge, not a full replace:
 * TaskResponse always includes every field (status, title, dueDate, ...)
 * regardless of which endpoint returned it. If updateTask's onSuccess wrote
 * the *entire* server response into the cache, and its response happened to
 * arrive after changeStatus's response (two independent requests racing —
 * arrival order isn't guaranteed just because you called one first), it
 * would silently stomp the just-changed status back to whatever it was when
 * the fields-only endpoint processed its request. That was the bug behind
 * "status changes, then snaps back to DONE." Each mutation now only merges
 * the keys the endpoint it called actually owns, so neither can clobber the
 * other no matter which response comes back first.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as taskApi from '../api/taskApi';

// Keys each endpoint is actually allowed to write. Used to build a narrow
// merge patch from a server response instead of trusting the whole object.
const FIELD_KEYS = ['title', 'description', 'priority', 'assignedToUserId', 'dueDate', 'updatedAt'];
const STATUS_KEYS = ['status', 'completedAt', 'position', 'updatedAt'];

function pick(obj, keys) {
  const out = {};
  keys.forEach((key) => {
    if (obj[key] !== undefined) out[key] = obj[key];
  });
  return out;
}

export function useTasks(projectId) {
  const queryClient = useQueryClient();
  const queryKey    = ['tasks', projectId];

  // ── Query ─────────────────────────────────────────────────────────────────
  const query = useQuery({
    queryKey,
    queryFn:   () => taskApi.getTasks(projectId),
    enabled:   !!projectId,
    staleTime: 1000 * 60 * 2,
    retry:     2,
    refetchOnWindowFocus: false,
  });

  // ── Create ────────────────────────────────────────────────────────────────
  // Backend always sets status = TODO. Do not include status in data.
  const createMutation = useMutation({
    mutationFn: (data) => taskApi.createTask(projectId, data),

    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      const optimistic = {
        id:               `optimistic-${Date.now()}`,
        projectId,
        createdByUserId:  null,
        assignedToUserId: data.assignedToUserId ?? null,
        title:            data.title,
        description:      data.description ?? '',
        status:           'TODO',            // always TODO on create
        priority:         data.priority ?? 'MEDIUM',
        dueDate:          data.dueDate ?? null,
        completedAt:      null,
        position:         data.position ?? 0,
        createdAt:        new Date().toISOString(),
        updatedAt:        new Date().toISOString(),
        _optimistic:      true,
      };

      queryClient.setQueryData(queryKey, (old) => [...(old ?? []), optimistic]);
      return { previous, optimisticId: optimistic.id };
    },

    onError: (_, __, ctx) => {
      queryClient.setQueryData(queryKey, ctx.previous);
    },

    onSuccess: (newTask, _, ctx) => {
      // Replace optimistic placeholder with the real server response — safe
      // as a full replace here, since this is brand-new row, not a merge
      // with something else that might be mid-flight.
      queryClient.setQueryData(queryKey, (old) =>
          (old ?? []).map((t) => (t.id === ctx.optimisticId ? newTask : t))
      );
    },
  });

  // ── Update fields (no status) ─────────────────────────────────────────────
  // Maps to PUT /tasks/{taskId} — UpdateTaskRequest
  const updateFieldsMutation = useMutation({
    mutationFn: ({ taskId, data }) =>
        taskApi.updateTask(projectId, taskId, data),

    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) =>
          (old ?? []).map((t) =>
              t.id === taskId
                  ? { ...t, ...data, updatedAt: new Date().toISOString() }
                  : t
          )
      );

      return { previous };
    },

    onError: (_, __, ctx) => {
      queryClient.setQueryData(queryKey, ctx.previous);
    },

    onSuccess: (updatedTask) => {
      // Narrow merge: only apply the keys this endpoint owns. Never let a
      // stale `status`/`completedAt` from this response overwrite a status
      // change that changeStatusMutation may have already applied (or is
      // still in flight) for the same task.
      const patch = pick(updatedTask, FIELD_KEYS);
      queryClient.setQueryData(queryKey, (old) =>
          (old ?? []).map((t) => (t.id === updatedTask.id ? { ...t, ...patch } : t))
      );
    },
  });

  // ── Change status (separate endpoint) ────────────────────────────────────
  // Maps to PUT /tasks/{taskId}/status — ChangeTaskStatusRequest
  // completedAt is auto-managed by the backend (set on DONE, cleared otherwise)
  const changeStatusMutation = useMutation({
    mutationFn: ({ taskId, status, position }) =>
        taskApi.changeTaskStatus(projectId, taskId, {
          status,
          ...(position !== undefined && { position }),
        }),

    onMutate: async ({ taskId, status, position }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) =>
          (old ?? []).map((t) =>
              t.id === taskId
                  ? {
                    ...t,
                    status,
                    ...(position !== undefined && { position }),
                    // Mirror backend's completedAt logic for the optimistic update
                    completedAt:
                        status === 'DONE'
                            ? (t.completedAt ?? new Date().toISOString())
                            : null,
                    updatedAt: new Date().toISOString(),
                  }
                  : t
          )
      );

      return { previous };
    },

    onError: (_, __, ctx) => {
      queryClient.setQueryData(queryKey, ctx.previous);
    },

    onSuccess: (updatedTask) => {
      // Narrow merge, mirroring updateFieldsMutation above: only apply the
      // keys this endpoint owns, so a slow status response can't clobber
      // title/description/etc. edited in the same save.
      const patch = pick(updatedTask, STATUS_KEYS);
      queryClient.setQueryData(queryKey, (old) =>
          (old ?? []).map((t) => (t.id === updatedTask.id ? { ...t, ...patch } : t))
      );
    },
  });

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (taskId) => taskApi.deleteTask(projectId, taskId),

    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) =>
          (old ?? []).filter((t) => t.id !== taskId)
      );
      return { previous };
    },

    onError: (_, __, ctx) => {
      queryClient.setQueryData(queryKey, ctx.previous);
    },
  });

  // ── Public interface ──────────────────────────────────────────────────────
  return {
    // Query state
    tasks:     query.data ?? [],
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error,
    refetch:   query.refetch,

    // Mutations — deliberately split to match the two backend endpoints.
    // Exposed as *Async variants too, so callers that fire both mutations
    // for one save can await them in sequence instead of racing.
    createTask:   createMutation.mutate,       // (data) — no status
    updateTask:   updateFieldsMutation.mutate, // ({ taskId, data }) — no status
    changeStatus: changeStatusMutation.mutate, // ({ taskId, status, position? })
    deleteTask:   deleteMutation.mutate,       // (taskId)

    updateTaskAsync:   updateFieldsMutation.mutateAsync,
    changeStatusAsync: changeStatusMutation.mutateAsync,

    // Pending flags
    isCreating: createMutation.isPending,
    isUpdating:
        updateFieldsMutation.isPending || changeStatusMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}