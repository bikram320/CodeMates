/**
 * src/pages/Notifications.jsx
 *
 * The authenticated user's notification inbox (/notifications).
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *   Notifications.jsx → useNotifications({ unreadOnly }) → notificationsApi.js
 *     → real backend (no mock)
 *
 * The Unread tab is a server-side filter (unreadOnly=true), refetched from the
 * backend rather than filtered client-side — see useNotifications.js. The type
 * chips below stay client-side, because the backend has no type filter; they
 * only filter whatever page(s) have been loaded so far, which is why "Load
 * more" (real cursor pagination now) matters once a filter hides everything
 * on the current page.
 */

import { useMemo, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

import NotificationHeader from "../components/notifications/NotificationHeader";
import NotificationFilters from "../components/notifications/NotificationFilters";
import NotificationList from "../components/notifications/NotificationList";
import { getNotificationMeta } from "../components/notifications/NotificationItem";
import EmptyState from "../components/ui/EmptyState";

import useNotifications from "../hooks/useNotifications";

const secondaryButton =
  "inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium " +
  "text-gray-800 transition-colors duration-150 hover:bg-gray-50 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300";

export default function Notifications() {
  const [status, setStatus] = useState("all"); // "all" | "unread"
  const [category, setCategory] = useState("all");

  const {
    notifications,
    unreadCount,
    hasMore,
    isFetchingMore,
    loadMore,
    isLoading,
    isError,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useNotifications({ unreadOnly: status === "unread" });

  // Status is already applied server-side (unreadOnly above); only the type
  // chip is client-side, since the backend has no type filter.
  const visible = useMemo(
    () => notifications.filter((item) => category === "all" || getNotificationMeta(item.type).category === category),
    [notifications, category]
  );

  const hasActiveFilters = status !== "all" || category !== "all";
  const clearFilters = () => {
    setStatus("all");
    setCategory("all");
  };

  return (
  <div className="notifications-page">
    <div className="flex w-full flex-col gap-4">
      <NotificationHeader unreadCount={unreadCount} isLoading={isLoading} onMarkAllAsRead={markAllAsRead} />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-white px-4 py-3">
          <NotificationFilters
            status={status}
            category={category}
            totalCount={notifications.length}
            unreadCount={unreadCount}
            disabled={isLoading || isError}
            onStatusChange={setStatus}
            onCategoryChange={setCategory}
          />
        </div>

        {isError ? (
          <div className="flex flex-col items-center px-4 py-10">
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load notifications"
              description={error?.message || "Something went wrong. Try again."}
            />
            <button type="button" onClick={() => refetch()} className={secondaryButton}>
              <RefreshCw size={14} />
              Try again
            </button>
          </div>
        ) : (
          <>
            <NotificationList
              notifications={visible}
              isLoading={isLoading}
              hasActiveFilters={hasActiveFilters}
              status={status}
              category={category}
              onMarkAsRead={markAsRead}
              onClearFilters={clearFilters}
            />

            {!isLoading && hasMore && (
              <div className="flex justify-center border-t border-gray-200 px-4 py-3">
                <button type="button" onClick={loadMore} disabled={isFetchingMore} className={secondaryButton}>
                  {isFetchingMore && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                  {isFetchingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  </div>
);
}