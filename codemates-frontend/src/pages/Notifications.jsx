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
  "inline-flex items-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium " +
  "text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40] " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

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
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <NotificationHeader unreadCount={unreadCount} isLoading={isLoading} onMarkAllAsRead={markAllAsRead} />

        <NotificationFilters
          status={status}
          category={category}
          totalCount={notifications.length}
          unreadCount={unreadCount}
          disabled={isLoading || isError}
          onStatusChange={setStatus}
          onCategoryChange={setCategory}
        />

        {isError ? (
          <div className="flex flex-col items-center">
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
              <button
                type="button"
                onClick={loadMore}
                disabled={isFetchingMore}
                className={`${secondaryButton} self-center`}
              >
                {isFetchingMore && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
                {isFetchingMore ? "Loading…" : "Load more"}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}