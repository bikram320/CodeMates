import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

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

const focusRing = "focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300";

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
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the menu on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const activeCategory = CATEGORY_OPTIONS.find((o) => o.id === category);

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Read status */}
      <div role="group" aria-label="Filter by read status" className="inline-flex gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              aria-pressed={active}
              onClick={() => onStatusChange(opt.id)}
              className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium
                          transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${focusRing} ${
                active
                  ? "border-[#6366F1] bg-[#6366F1] text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
              {!disabled && (
                <span
                  className={`rounded px-1.5 text-xs tabular-nums ${
                    active ? "bg-white text-[#6366F1]" : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {counts[opt.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Group by (type filter) */}
      <div ref={menuRef} className="relative">
        <button
          type="button"
          disabled={disabled}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5
                      text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50
                      disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
        >
          Group by
          {category !== "all" && <span className="text-[#6366F1]">: {activeCategory?.label}</span>}
          <ChevronDown size={14} aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {CATEGORY_OPTIONS.map((opt) => {
              const active = category === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    onCategoryChange(opt.id);
                    setOpen(false);
                  }}
                  className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    active ? "font-medium text-[#6366F1]" : "text-gray-700"
                  }`}
                >
                  {opt.label}
                  {active && <Check size={14} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}