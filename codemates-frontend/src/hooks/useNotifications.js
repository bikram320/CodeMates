/**
 * src/hooks/useNotifications.js
 *
 * Data hook for the Notifications page.
 *
 *   Notifications.jsx → useNotifications({ unreadOnly }) → notificationsApi.js → real backend
 *
 * Two independent queries, since the backend has two independent endpoints:
 *   - the list, paginated with useInfiniteQuery (the backend's `before`
 *     cursor is real now, not simulated, so this actually pages through
 *     more than the first 20 notifications — see `loadMore`)
 *   - the unread count, from GET /api/notifications/unread-count. It's kept
 *     separate rather than computed by counting loaded items, because that
 *     would only be correct once every page had been loaded; this endpoint
 *     is authoritative regardless of how much of the list is loaded.
 *
 * `unreadOnly` is a server-side filter (the only one the backend supports),
 * so switching the Unread tab re-queries the backend rather than filtering
 * client-side. There's no `type` filter on the backend, so the type chips in
 * Notifications.jsx still filter client-side over whatever's loaded.
 *
 * Mutations (markAsRead / markAllAsRead / deleteNotification) patch every
 * cached list — both the "all" and "unread" variants, whichever are in the
 * cache — optimistically, roll back on failure, and invalidate everything
 * afterwards so the server has the final word.
 */

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '../api/notificationsApi';

const LIST_ROOT_KEY = ['notifications', 'list'];
const PAGE_SIZE = 20;

export const notificationKeys = {
  list: (unreadOnly) => [...LIST_ROOT_KEY, { unreadOnly }],
  unreadCount: ['notifications', 'unreadCount'],
};

/** Every cached list query currently in the cache, as [queryKey, data] pairs — used to roll back on a failed mutation. */
const snapshotListQueries = (queryClient) => queryClient.getQueriesData({ queryKey: LIST_ROOT_KEY });
const restoreListQueries = (queryClient, entries) => entries.forEach(([key, data]) => queryClient.setQueryData(key, data));

/** Applies `updater` (old notifications[] → new notifications[]) to every cached list query's every page. */
function patchListQueries(queryClient, updater) {
  queryClient.setQueriesData({ queryKey: LIST_ROOT_KEY }, (old) =>
    old && { ...old, pages: old.pages.map((page) => ({ ...page, notifications: updater(page.notifications) })) }
  );
}

export function useNotifications({ unreadOnly = false } = {}) {
  const queryClient = useQueryClient();

  const listQuery = useInfiniteQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: ({ pageParam }) => notificationsApi.getNotifications({ before: pageParam, limit: PAGE_SIZE, unreadOnly }),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.nextCursor : undefined),
    retry: false,
  });

  const unreadCountQuery = useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: notificationsApi.getUnreadCount,
    retry: false,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: LIST_ROOT_KEY });
    queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount });
  };

  /** Shared optimistic-update wiring for a mutation. `patch(list, arg)` returns the new list for one page. */
  const optimistic = (patch) => ({
    onMutate: async (arg) => {
      await queryClient.cancelQueries({ queryKey: LIST_ROOT_KEY });
      const previousEntries = snapshotListQueries(queryClient);
      patchListQueries(queryClient, (list) => patch(list, arg));
      return { previousEntries };
    },
    onError: (_err, _arg, context) => {
      if (context?.previousEntries) restoreListQueries(queryClient, context.previousEntries);
    },
    onSettled: invalidateAll,
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationsApi.markNotificationAsRead,
    ...optimistic((list, id) =>
      list.map((n) => (n.id === id && !n.isRead ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    ),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationsApi.markAllNotificationsAsRead,
    ...optimistic((list) => {
      const readAt = new Date().toISOString();
      return list.map((n) => (n.isRead ? n : { ...n, isRead: true, readAt }));
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsApi.deleteNotification,
    ...optimistic((list, id) => list.filter((n) => n.id !== id)),
  });

  const notifications = listQuery.data?.pages.flatMap((page) => page.notifications) ?? [];
  const hasMore = listQuery.data?.pages.at(-1)?.hasMore ?? false;

  return {
    notifications,
    unreadCount: unreadCountQuery.data?.unreadCount ?? 0,
    hasMore,
    isFetchingMore: listQuery.isFetchingNextPage,
    loadMore: () => listQuery.fetchNextPage(),

    isLoading: listQuery.isLoading || unreadCountQuery.isLoading,
    isError: listQuery.isError,
    error: listQuery.error,
    refetch: () => {
      listQuery.refetch();
      unreadCountQuery.refetch();
    },

    markAsRead: (id) => markAsReadMutation.mutate(id),
    markAllAsRead: () => markAllAsReadMutation.mutate(),
    deleteNotification: (id) => deleteMutation.mutate(id),
  };
}

export default useNotifications;