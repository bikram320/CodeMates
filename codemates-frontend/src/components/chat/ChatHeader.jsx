<<<<<<< Updated upstream
import { Users } from "lucide-react";
=======

import Avatar from "../ui/Avatar";
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
      className={`flex items-center justify-between gap-3 border-b border-[var(--cm-border)] px-5 py-4 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {isGroup || !avatarUrl ? (
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
=======
      className={`flex items-center justify-between gap-3 border-b-2 border-gray-300 bg-white px-5 py-4 ${className}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={title} src={isGroup ? undefined : avatarUrl} size={36} />
>>>>>>> Stashed changes

        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-[var(--cm-text)]">
            {title}
          </h2>
          {subtitle && (
            <p className="truncate text-xs text-[var(--cm-muted)]">{subtitle}</p>
          )}
        </div>
      </div>

<<<<<<< Updated upstream
      {action && <div className="shrink-0">{action}</div>}
=======
      {/* Mute button, rightmost */}
      <div className="flex shrink-0 items-center">{action}</div>
>>>>>>> Stashed changes
    </div>
  );
}