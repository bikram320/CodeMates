import { X } from "lucide-react";
import Avatar from "../ui/Avatar";

/**
 * Header for the currently open conversation.
 *
 * Props:
 * - title, subtitle, avatarUrl, isGroup   as before
 * - action    optional node, right-aligned — e.g. a mute/unmute button
 * - onClose   optional () => void — shows an "X" that closes the open chat
 */
export default function ChatHeader({
                                     title,
                                     subtitle,
                                     avatarUrl,
                                     isGroup = false,
                                     action,
                                     onClose,
                                     className = "",
                                   }) {
  return (
      <div
          className={`flex items-center justify-between gap-3 border-b border-[var(--cm-border)] px-5 py-4 ${className}`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={title} src={isGroup ? undefined : avatarUrl} size={36} />

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-[var(--cm-text)]">
              {title}
            </h2>
            {subtitle && (
                <p className="truncate text-xs text-[var(--cm-muted)]">{subtitle}</p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {action}
          {onClose && (
              <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close conversation"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--cm-muted)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
              >
                <X size={16} />
              </button>
          )}
        </div>
      </div>
  );
}