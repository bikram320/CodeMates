import { Bell, CheckCheck, SearchX } from "lucide-react";

import EmptyState from "../ui/EmptyState";
import NotificationItem from "./NotificationItem";

const DAY = 86_400_000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Splits (already newest-first) notifications into Today / Yesterday / Earlier. */
function groupByDay(items) {
  const today = startOfDay(new Date());
  const groups = [
    { key: "today", label: "Today", items: [] },
    { key: "yesterday", label: "Yesterday", items: [] },
    { key: "earlier", label: "Earlier", items: [] },
  ];
  items.forEach((item) => {
    const daysAgo = Math.round((today - startOfDay(new Date(item.createdAt))) / DAY);
    groups[daysAgo <= 0 ? 0 : daysAgo === 1 ? 1 : 2].items.push(item);
  });
  return groups.filter((g) => g.items.length > 0);
}

function NotificationSkeleton() {
  return (
    <div role="status" aria-label="Loading notifications" className="divide-y divide-gray-200 bg-white">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} aria-hidden="true" className="flex animate-pulse items-center gap-3 px-4 py-3">
          <div className="h-2 w-2 rounded-full bg-gray-200" />
          <div className="h-4 w-4 rounded bg-gray-200" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded bg-gray-200" />
            <div className="h-3.5 w-1/2 rounded bg-gray-200" />
          </div>
          <div className="h-5 w-16 rounded bg-gray-200" />
          <div className="h-3 w-14 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

function NotificationEmpty({ hasActiveFilters, status, category, onClearFilters }) {
  const caughtUp = hasActiveFilters && status === "unread" && category === "all";

  if (!hasActiveFilters) {
    return (
      <EmptyState
        icon={Bell}
        title="No notifications yet"
        description="Project invitations, task assignments, messages and GitHub activity will show up here."
      />
    );
  }

  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={caughtUp ? CheckCheck : SearchX}
        title={caughtUp ? "You're all caught up" : "No matching notifications"}
        description={
          caughtUp
            ? "You have no unread notifications."
            : "Nothing matches these filters. Try another type or clear the filters."
        }
      />
      {!caughtUp && (
        <button
          type="button"
          onClick={onClearFilters}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium
           text-gray-800 transition-colors duration-150 hover:bg-gray-50
           focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}

export default function NotificationList({
  notifications,
  isLoading,
  hasActiveFilters,
  status,
  category,
  onMarkAsRead,
  onClearFilters,
}) {
  if (isLoading) return <NotificationSkeleton />;

  if (notifications.length === 0) {
    return (
      <NotificationEmpty
        hasActiveFilters={hasActiveFilters}
        status={status}
        category={category}
        onClearFilters={onClearFilters}
      />
    );
  }

    return (
    <div className="bg-white">
      {groupByDay(notifications).map((group) => (
        <section key={group.key} aria-labelledby={`notif-group-${group.key}`}>
          <h2
            id={`notif-group-${group.key}`}
            className="border-b border-gray-200 bg-gray-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-600"
          >
            {group.label}
          </h2>
          <ul className="divide-y divide-gray-200 border-b border-gray-200 last:border-b-0">
            {group.items.map((item) => (
              <NotificationItem key={item.id} notification={item} onMarkAsRead={onMarkAsRead} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}