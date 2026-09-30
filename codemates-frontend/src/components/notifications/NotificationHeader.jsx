import { Bell, CheckCheck } from "lucide-react";

export default function NotificationHeader({ unreadCount, isLoading, onMarkAllAsRead }) {
  const subtitle = isLoading
    ? "Loading your notifications…"
    : unreadCount > 0
    ? `You have ${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}.`
    : "You're all caught up.";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <Bell size={28} className="shrink-0 text-indigo-500" aria-hidden="true" />
          <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
        </div>
        <p className="mt-1 text-sm text-gray-600" aria-live="polite">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onMarkAllAsRead}
        disabled={isLoading || unreadCount === 0}
        className="inline-flex cursor-pointer items-center justify-center gap-2 self-start rounded-lg bg-[#6366F1] px-4 py-2
                   text-sm font-medium text-white transition-colors duration-150 hover:bg-[#4F46E5]
                   disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#6366F1]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
      >
        <CheckCheck size={15} aria-hidden="true" />
        Mark all as read
      </button>
    </div>
  );
}