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
    <div role="status" aria-label="Loading notifications" className="flex flex-col gap-3">
      <div aria-hidden="true" className="h-4 w-16 animate-pulse rounded bg-[#1D1A40]" />
      <div
        aria-hidden="true"
        className="overflow-hidden rounded-xl border border-[#1C1A38] bg-[#0A0918]"
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex animate-pulse items-start gap-4 border-b border-[#1C1A38] px-5 py-4 last:border-0">
            <div className="h-10 w-10 shrink-0 rounded-xl bg-[#1D1A40]" />
            <div className="flex-1 space-y-2.5">
              <div className="flex justify-between gap-4">
                <div className="h-3.5 w-1/3 rounded bg-[#1D1A40]" />
                <div className="h-3 w-12 rounded bg-[#1D1A40]" />
              </div>
              <div className="h-3 w-full rounded bg-[#1D1A40]" />
              <div className="h-3 w-3/5 rounded bg-[#1D1A40]" />
              <div className="h-5 w-24 rounded bg-[#1D1A40]" />
            </div>
          </div>
        ))}
      </div>
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
          className="inline-flex items-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium
                     text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40]
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
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
    <div className="flex flex-col gap-6">
      {groupByDay(notifications).map((group) => (
        <section key={group.key} aria-labelledby={`notif-group-${group.key}`}>
          <h2 id={`notif-group-${group.key}`} className="page-section-heading mb-3">
            {group.label}
          </h2>
          <ul className="overflow-hidden rounded-xl border border-[#1C1A38] bg-[#0A0918] divide-y divide-[#1C1A38]">
            {group.items.map((item) => (
              <NotificationItem key={item.id} notification={item} onMarkAsRead={onMarkAsRead} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}