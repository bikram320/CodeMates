import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";

import useNotifications from "../../hooks/useNotifications";
import { formatRelativeTime, getNotificationMeta } from "./NotificationItem";

const PREVIEW_COUNT = 6;

/**
 * Navbar bell + small notifications popover.
 *
 * Clicking the bell opens a dropdown with the latest notifications (mark one
 * or all as read right there) and a "View all" link to /notifications,
 * instead of navigating away.
 *
 * Props:
 * - countOverride         optional number; falls back to the real unread count
 * - onNotificationsClick  optional; if given, the bell calls this instead of
 *                         opening the popover (keeps the old Navbar API working)
 */
export default function NotificationBell({ countOverride, onNotificationsClick }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const { notifications, unreadCount, isLoading, isError, markAsRead, markAllAsRead } =
    useNotifications({ unreadOnly: false });

  const count = countOverride || unreadCount || 0;
  const recent = notifications.slice(0, PREVIEW_COUNT);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleBellClick = () => {
    if (onNotificationsClick) onNotificationsClick();
    else setOpen((o) => !o);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleBellClick}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--cm-text-dim)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
      >
        <Bell size={21} />
        {count > 0 && (
          <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--cm-indigo)] px-1 text-[10px] font-medium text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 z-50 mt-2 w-[26rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-[var(--cm-border)] bg-white shadow-xl shadow-black/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-[var(--cm-border)] px-4 py-3">
            <h2 className="text-sm font-semibold text-[var(--cm-text)]">
              Notifications
              {count > 0 && (
                <span className="ml-2 rounded-full bg-[var(--cm-indigo-soft)] px-2 py-0.5 text-xs font-medium text-[var(--cm-indigo)]">
                  {count} new
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={() => markAllAsRead()}
              disabled={isLoading || unreadCount === 0}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[var(--cm-indigo)] transition-colors hover:bg-[var(--cm-indigo-soft)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
            >
              <CheckCheck size={13} aria-hidden="true" />
              Mark all read
            </button>
          </div>

          {/* Body */}
          <div className="max-h-[22rem] overflow-y-auto">
            {isLoading ? (
              <ul aria-label="Loading notifications" className="divide-y divide-[var(--cm-border)]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} aria-hidden="true" className="flex animate-pulse items-start gap-3 px-4 py-3">
                    <div className="mt-1 h-8 w-8 shrink-0 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-gray-200" />
                      <div className="h-3 w-full rounded bg-gray-200" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : isError ? (
              <p className="px-4 py-8 text-center text-sm text-[var(--cm-text-dim)]">
                Couldn't load notifications. Try again later.
              </p>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <Bell size={22} className="text-[var(--cm-muted)]" aria-hidden="true" />
                <p className="text-sm font-medium text-[var(--cm-text)]">No notifications yet</p>
                <p className="text-xs text-[var(--cm-text-dim)]">
                  Invitations, tasks, messages and GitHub activity will show up here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--cm-border)]">
                {recent.map((n) => {
                  const { icon: Icon, accent } = getNotificationMeta(n.type);
                  return (
                    <li key={n.id}>
                      <button
                        type="button"
                        onClick={() => !n.isRead && markAsRead(n.id)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--cm-surface)] ${
                          n.isRead ? "" : "bg-[var(--cm-indigo-soft)]/40"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white ring-1 ring-[var(--cm-border)]"
                          style={{ color: accent }}
                        >
                          <Icon size={15} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm ${
                              n.isRead ? "font-normal text-[var(--cm-text-dim)]" : "font-semibold text-[var(--cm-text)]"
                            }`}
                          >
                            {!n.isRead && <span className="sr-only">Unread: </span>}
                            {n.title}
                          </span>
                          {n.body && (
                            <span className="mt-0.5 line-clamp-2 block text-xs text-[var(--cm-text-dim)]">
                              {n.body}
                            </span>
                          )}
                          <time
                            dateTime={n.createdAt}
                            className="mt-1 block text-xs text-[var(--cm-muted)]"
                          >
                            {formatRelativeTime(n.createdAt)}
                          </time>
                        </span>

                        {!n.isRead && (
                          <span
                            aria-hidden="true"
                            className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[var(--cm-indigo)]"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="block border-t border-[var(--cm-border)] px-4 py-3 text-center text-sm font-medium text-[var(--cm-indigo)] transition-colors hover:bg-[var(--cm-surface)]"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
