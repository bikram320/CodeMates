/**
 * src/pages/Notifications.jsx
 *
 * The authenticated user's notification inbox (/notifications).
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *
 *   Notifications.jsx
 *       ↓  calls
 *   useNotifications()        src/hooks/useNotifications.js
 *       ↓  calls
 *   notificationsApi.js       src/api/notificationsApi.js
 *       ↓  currently routes to
 *   notificationsMock.js      src/mock/notificationsMock.js
 *
 * This page only handles filtering and layout. Filters are client-side because
 * the backend has no type filter.
 *
 * Testing states with mock data: add ?mockNotifications=empty or
 * ?mockNotifications=error to the URL.
 */

import { useMemo, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

import NotificationHeader from "../components/notifications/NotificationHeader";
import NotificationFilters from "../components/notifications/NotificationFilters";
import NotificationList from "../components/notifications/NotificationList";
import { getNotificationMeta } from "../components/notifications/NotificationItem";
import EmptyState from "../components/ui/EmptyState";

import useNotifications from "../hooks/useNotifications";

const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium " +
  "text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

export default function Notifications() {
  const {
    notifications,
    unreadCount,
    isLoading,
    isError,
    error,
    refetch,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [status, setStatus] = useState("all"); // "all" | "unread"
  const [category, setCategory] = useState("all");

  const visible = useMemo(
    () =>
      notifications.filter(
        (item) =>
          (status === "all" || !item.isRead) &&
          (category === "all" || getNotificationMeta(item.type).category === category)
      ),
    [notifications, status, category]
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
          <NotificationList
            notifications={visible}
            isLoading={isLoading}
            hasActiveFilters={hasActiveFilters}
            status={status}
            category={category}
            onMarkAsRead={markAsRead}
            onClearFilters={clearFilters}
          />
        )}
      </div>
    </div>
  );
}