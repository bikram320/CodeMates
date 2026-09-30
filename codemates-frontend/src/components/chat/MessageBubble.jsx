import { useState } from "react";
import { Check, Pencil, Trash2, X as XIcon } from "lucide-react";
import Avatar from "../ui/Avatar";

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * One message bubble, with real inline edit/delete for your own messages
 * (both are real backend calls — sender-only, enforced server-side).
 * Hover reveals the edit/delete icons; clicking Edit swaps the bubble
 * for a small textarea.
 *
 * Props:
 * - id, content, createdAt, isEdited
 * - isOwn           boolean — right-aligned + indigo fill, edit/delete
 *                    only ever shown for your own messages
 * - senderName, senderAvatarUrl   shown above others' bubbles
 * - onEdit(id, newContent), onDelete(id)   omit to hide those actions
 */
export default function MessageBubble({
  id,
  content,
  createdAt,
  isOwn = false,
  senderName,
  senderAvatarUrl,
  isEdited = false,
  onEdit,
  onDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(content);

  function handleSaveEdit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== content) {
      onEdit?.(id, trimmed);
    }
    setIsEditing(false);
  }

  return (
    <div className={`group flex items-start gap-2 ${isOwn ? "flex-row-reverse" : ""}`}>
      {!isOwn && <Avatar name={senderName ?? "?"} src={senderAvatarUrl} size={28} />}

      <div className={`flex max-w-[75%] flex-col ${isOwn ? "items-end" : "items-start"}`}>
        {isEditing ? (
          <div className="flex w-full flex-col gap-1.5">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              autoFocus
              className="w-full resize-none rounded-md border border-[var(--cm-indigo)] bg-[var(--cm-surface)] px-3 py-2 text-sm text-[var(--cm-text)] focus:outline-none"
            />
            <div className="flex gap-1.5 self-end">
              <button
                type="button"
                onClick={handleSaveEdit}
                aria-label="Save edit"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[var(--cm-indigo)] text-white"
              >
                <Check size={13} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(content);
                  setIsEditing(false);
                }}
                aria-label="Cancel edit"
                className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-[var(--cm-surface-2)] text-[var(--cm-muted)]"
              >
                <XIcon size={13} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            {isOwn && (onEdit || onDelete) && (
              <span className="hidden gap-1 group-hover:flex">
                {onEdit && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    aria-label="Edit message"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--cm-muted)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
                  >
                    <Pencil size={12} />
                  </button>
                )}
                {onDelete && (
                  <button
                    type="button"
                    onClick={() => onDelete(id)}
                    aria-label="Delete message"
                    className="inline-flex h-6 w-6 items-center justify-center rounded-md text-[var(--cm-muted)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-lavender)]"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
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
          </div>
        )}

        <span className="mt-1 px-1 text-[10px] text-[var(--cm-muted)]">
          {formatTime(createdAt)}
          {isEdited && " · edited"}
        </span>
      </div>
    </div>
  );
}