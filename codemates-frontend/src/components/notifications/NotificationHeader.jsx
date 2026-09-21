import { CheckCheck } from "lucide-react";

export default function NotificationHeader({ unreadCount, isLoading, onMarkAllAsRead }) {
  const subtitle = isLoading
    ? "Loading your notifications…"
    : unreadCount > 0
    ? `You have ${unreadCount} unread ${unreadCount === 1 ? "notification" : "notifications"}.`
    : "You're all caught up.";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold text-[#F5F5F5]">Notifications</h1>
        <p className="mt-1 text-sm text-[#8B86B8]" aria-live="polite">
          {subtitle}
        </p>
      </div>

      <button
        type="button"
        onClick={onMarkAllAsRead}
        disabled={isLoading || unreadCount === 0}
        className="inline-flex items-center justify-center gap-2 self-start rounded-lg border border-[#2E2A66] px-4 py-2
                   text-sm font-medium text-[#F5F5F5] transition-colors duration-150
                   hover:border-[#6C7BFF] hover:bg-[#1D1A40]
                   disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#2E2A66] disabled:hover:bg-transparent
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
      >
        <CheckCheck size={15} aria-hidden="true" />
        Mark all as read
      </button>
    </div>
  );
}