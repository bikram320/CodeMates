export const STATUS_OPTIONS = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
];

// `id` matches the `category` field in NOTIFICATION_TYPES (NotificationItem.jsx).
export const CATEGORY_OPTIONS = [
  { id: "all", label: "All types" },
  { id: "projects", label: "Projects" },
  { id: "tasks", label: "Tasks" },
  { id: "messages", label: "Messages" },
  { id: "github", label: "GitHub" },
];

const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

export default function NotificationFilters({
  status,
  category,
  totalCount,
  unreadCount,
  disabled = false,
  onStatusChange,
  onCategoryChange,
}) {
  const counts = { all: totalCount, unread: unreadCount };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Read status */}
      <div
        role="group"
        aria-label="Filter by read status"
        className="inline-flex self-start rounded-lg border border-[#1C1A38] bg-[#0A0918] p-1"
      >
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onStatusChange(opt.id)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors
                          disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
                active ? "bg-[#1D1A40] text-[#F5F5F5]" : "text-[#8B86B8] hover:text-[#F5F5F5]"
              }`}
            >
              {opt.label}
              {!disabled && (
                <span
                  className={`rounded px-1.5 text-xs tabular-nums ${
                    opt.id === "unread" && unreadCount > 0
                      ? "bg-[#6C7BFF] text-[#0A0918]"
                      : "bg-[#26224A] text-[#A9A6C8]"
                  }`}
                >
                  {counts[opt.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Type */}
      <div
        role="group"
        aria-label="Filter by notification type"
        className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0"
      >
        {CATEGORY_OPTIONS.map((opt) => {
          const active = category === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onCategoryChange(opt.id)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors
                          disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
                active
                  ? "border-[#C9A8FF]/60 bg-[#C9A8FF]/10 text-[#C9A8FF]"
                  : "border-[#2E2A66] text-[#A9A6C8] hover:border-[#6C7BFF] hover:text-[#F5F5F5]"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}