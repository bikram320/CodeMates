/**
 * One message bubble. Deliberately takes senderName/senderAvatarUrl as
 * separate props rather than expecting them on the message object —
 * MessageResponse from the real API only has senderUserId, so the caller
 * (MessageList) resolves the sender from a user directory, matching how
 * a real integration will have to work.
 *
 * Props:
 * - content         string
 * - createdAt       ISO string
 * - isOwn           boolean — right-aligned + indigo fill when true
 * - senderName      string — shown above the bubble for others' messages
 * - senderAvatarUrl string
 * - isEdited        boolean
 */
function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MessageBubble({
  content,
  createdAt,
  isOwn = false,
  senderName,
  senderAvatarUrl,
  isEdited = false,
}) {
  return (
    <div
      className={`flex items-end gap-2 ${isOwn ? "flex-row-reverse" : ""}`}
    >
      {!isOwn && (
        <img
          src={senderAvatarUrl}
          alt={senderName}
          className="h-7 w-7 shrink-0 rounded-full object-cover"
        />
      )}

      <div className={`flex max-w-[75%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {!isOwn && senderName && (
          <span className="mb-1 px-1 text-xs text-[var(--cm-muted)]">
            {senderName}
          </span>
        )}

        <div
          className={`rounded-lg px-3.5 py-2 text-sm leading-relaxed ${
            isOwn
              ? "rounded-br-sm bg-[var(--cm-indigo)] text-white"
              : "rounded-bl-sm bg-[var(--cm-surface-2)] text-[var(--cm-text)]"
          }`}
        >
          {content}
        </div>

        <span className="mt-1 px-1 text-[10px] text-[var(--cm-muted)]">
          {formatTime(createdAt)}
          {isEdited && " · edited"}
        </span>
      </div>
    </div>
  );
}