import { Users } from "lucide-react";

/**
 * Header for the currently open conversation: name, and either a member
 * count + online count (for a PROJECT/group conversation) or the other
 * participant's online status (for a DIRECT conversation).
 *
 * Props:
 * - title       string
 * - subtitle    string — e.g. "3 members · 2 online" or "Online"
 * - avatarUrl   string | null
 * - isGroup     boolean
 */
export default function ChatHeader({
  title,
  subtitle,
  avatarUrl,
  isGroup = false,
  className = "",
}) {
  return (
    <div
      className={`flex items-center gap-3 border-b border-[var(--cm-border)] px-5 py-4 ${className}`}
    >
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

      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-[var(--cm-text)]">
          {title}
        </h2>
        {subtitle && (
          <p className="truncate text-xs text-[var(--cm-muted)]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}