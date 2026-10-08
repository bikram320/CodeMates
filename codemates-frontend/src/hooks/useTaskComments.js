/**
 * src/hooks/useTaskComments.js
 *
 * React Query hook for a single task's comment thread.
 * Wired to the real Spring Boot API — see taskCommentApi.js.
 *
 * Cache key: ['taskComments', projectId, taskId] — scoped per task, so
 * opening a different task's modal doesn't show stale comments while its
 * own list loads.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addTaskComment,
  deleteTaskComment,
  getTaskComments,
  updateTaskComment,
} from '../api/taskCommentApi';

export function useTaskComments(projectId, taskId) {
  const queryClient = useQueryClient();
  const queryKey = ['taskComments', projectId, taskId];

  const query = useQuery({
    queryKey,
    queryFn: () => getTaskComments(projectId, taskId),
    enabled: Boolean(projectId) && Boolean(taskId),
    staleTime: 1000 * 30,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationFn: (content) => addTaskComment(projectId, taskId, content),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ commentId, content }) => updateTaskComment(projectId, taskId, commentId, content),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: (commentId) => deleteTaskComment(projectId, taskId, commentId),
    onSuccess: invalidate,
  });

  return {
    comments: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,

    // Each accepts (variables, { onSuccess, onError, onSettled }) per-call,
    // used by TaskComments.jsx to reset just the row/input that acted.
    addComment: addMutation.mutate,
    isAdding: addMutation.isPending,

    updateComment: updateMutation.mutate,
    isUpdating: updateMutation.isPending,

    deleteComment: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
