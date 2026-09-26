import Avatar from "../ui/Avatar";

/**
 * One row in the conversation sidebar. Purely presentational — receives
 * already-resolved display data (name/avatar/online status) rather than
 * a raw ConversationResponse, since resolving that requires cross-
 * referencing project data and the user directory (done in Messages.jsx /
 * ProjectChat.jsx).
 *
 * Props:
 * - displayName    string
 * - avatarUrl      string | null   null falls back to a colored initial,
 *                                  same as Avatar everywhere else in the app
 * - isGroup        boolean         shows a Users icon instead of an avatar
 * - lastMessagePreview   string
 * - isOnline       boolean         only meaningful for DIRECT conversations
 * - unread         boolean
 * - active         boolean
 */
export default function ConversationItem({
                                           displayName,
                                           avatarUrl,
                                           isGroup = false,
                                           lastMessagePreview,
                                           isOnline = false,
                                           unread = false,
                                           active = false,
                                           onClick,
                                         }) {
  return (
      <button
          type="button"
          onClick={onClick}
          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
              active
                  ? "bg-[var(--cm-indigo-soft)]"
                  : "hover:bg-[var(--cm-surface)]"
          }`}
      >
        <div className="relative shrink-0">
          <Avatar name={displayName} src={isGroup ? undefined : avatarUrl} size={36} />
          {!isGroup && isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--cm-bg)] bg-[var(--cm-indigo)]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p
                className={`truncate text-sm ${
                    unread
                        ? "font-semibold text-[var(--cm-text)]"
                        : "font-medium text-[var(--cm-text-dim)]"
                }`}
            >
              {displayName}
            </p>
            {unread && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--cm-indigo)]" />
            )}
          </div>
          {lastMessagePreview && (
              <p className="truncate text-xs text-[var(--cm-muted)]">
                {lastMessagePreview}
              </p>
          )}
        </div>
      </button>
  );
}