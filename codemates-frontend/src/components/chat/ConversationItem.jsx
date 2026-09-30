import { Users } from "lucide-react";

/**
 * One row in the conversation sidebar. Purely presentational — receives
 * already-resolved display data (name/avatar/online status) rather than
 * a raw ConversationResponse, since resolving that requires cross-
 * referencing project data and the user directory (done in ProjectChat.jsx).
 *
 * Props:
 * - displayName    string
 * - avatarUrl      string | null   null for group (PROJECT) conversations
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
<<<<<<< Updated upstream
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
        {isGroup || !avatarUrl ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--cm-surface-2)] text-[var(--cm-muted)]">
            <Users size={16} />
          </span>
        ) : (
          <img
            src={avatarUrl}
            alt={displayName}
            className="h-9 w-9 rounded-full object-cover"
          />
        )}
        {!isGroup && isOnline && (
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--cm-bg)] bg-[var(--cm-indigo)]" />
        )}
      </div>
=======
      <button
          type="button"
          onClick={onClick}
          className={`flex w-full cursor-pointer items-center gap-3 rounded-md border px-3 py-2.5 text-left transition-colors ${
            active
              ? "border-gray-300 bg-white"
              : "border-transparent bg-white hover:bg-gray-50"
          }`}
        >
        <div className="relative shrink-0">
          <Avatar name={displayName} src={isGroup ? undefined : avatarUrl} size={36} />
          {!isGroup && isOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
          )}
        </div>
>>>>>>> Stashed changes

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