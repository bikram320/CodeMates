/**
 * src/hooks/useNotifications.js
 *
 * Data hook for the Notifications page.
 *
 *   Notifications.jsx → useNotifications() → notificationsApi.js → mock / real API
 *
 * Read/delete changes are applied to the cache immediately (optimistic) and
 * rolled back if the request fails, then the list is refetched to stay in sync.
 */

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  deleteNotification,
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../api/notificationsApi";

export const notificationKeys = {
  all: ["notifications"],
  list: () => ["notifications", "list"],
};

const EMPTY = [];

export function useNotifications() {
  const queryClient = useQueryClient();
  const listKey = notificationKeys.list();

  const query = useQuery({
    queryKey: listKey,
    queryFn: () => getNotifications(),
    retry: false, // fail fast while mocked; raise to 1–2 once the real API is wired
  });

  /** Builds optimistic-update handlers for a mutation. `patch(list, arg)` returns the new list. */
  const optimistic = (patch) => ({
    onMutate: async (arg) => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const previous = queryClient.getQueryData(listKey);
      queryClient.setQueryData(
        listKey,
        (old) => old && { ...old, notifications: patch(old.notifications, arg) }
      );
      return { previous };
    },
    onError: (_err, _arg, context) => {
      if (context?.previous) queryClient.setQueryData(listKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: listKey }),
  });

  const markAsReadMutation = useMutation({
    mutationFn: markNotificationAsRead,
    ...optimistic((list, id) =>
      list.map((n) => (n.id === id && !n.isRead ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    ),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: markAllNotificationsAsRead,
    ...optimistic((list) => {
      const readAt = new Date().toISOString();
      return list.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt }));
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNotification,
    ...optimistic((list, id) => list.filter((n) => n.id !== id)),
  });

  const notifications = query.data?.notifications ?? EMPTY;
  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

  return {
    notifications,
    unreadCount,
    hasMore: query.data?.hasMore ?? false,

    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,

    markAsRead: (id) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id) => deleteMutation.mutate(id),
  };
}

export default useNotifications;