import { Users } from "lucide-react";

const initials = (name = "") =>
    name
        .replace(/^@/, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "?";

/**
 * Header for the currently open conversation.
 *
 * Props:
 * - title, subtitle, avatarUrl, isGroup   as before
 * - action   optional node, right-aligned — e.g. a mute/unmute button
 */
export default function ChatHeader({
                                     title,
                                     subtitle,
                                     avatarUrl,
                                     isGroup = false,
                                     action,
                                     className = "",
                                   }) {
  return (
      <div
          className={`flex items-center justify-between gap-3 border-b border-[var(--cm-border)] px-5 py-4 ${className}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          {!isGroup && !avatarUrl ? (
              <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cm-indigo-soft)] text-xs font-semibold text-[var(--cm-lavender)]"
              >
            {initials(title)}
          </span>
          ) : isGroup ? (
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--cm-surface-2)] text-[var(--cm-muted)]">
            <Users size={16} />
          </span>
          ) : (
              <img
                  src={avatarUrl}
                  alt={title}
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
          )}

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-[var(--cm-text)]">
              {title}
            </h2>
            {subtitle && (
                <p className="truncate text-xs text-[var(--cm-muted)]">{subtitle}</p>
            )}
          </div>
        </div>

        {action && <div className="shrink-0">{action}</div>}
      </div>
  );
}