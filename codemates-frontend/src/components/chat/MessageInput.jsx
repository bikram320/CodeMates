import { useState } from "react";
import { Send } from "lucide-react";
import Button from "../ui/Button";

/**
 * Message composer. Fires onTyping on every keystroke and onSend when
 * the message is submitted — in the real app these map directly to the
 * two WebSocket frames (see ProjectChat.jsx): /app/conversations/{id}/typing
 * and /app/conversations/{id}/send. There's no REST equivalent for either.
 *
 * Props:
 * - onSend     (content: string) => void
 * - onTyping   () => void   called on every keystroke (debounce upstream if needed)
 * - disabled   boolean
 */
export default function MessageInput({ onSend, onTyping, disabled = false }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setValue("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-[var(--cm-border)] p-4"
    >
      <textarea
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onTyping?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        rows={1}
        placeholder="Type a message..."
        disabled={disabled}
        className="max-h-32 flex-1 resize-none rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface)] px-3 py-2 text-sm text-[var(--cm-text)] placeholder:text-[var(--cm-muted)] focus:border-[var(--cm-indigo)] focus:outline-none disabled:opacity-50"
      />
      <Button
        type="submit"
        variant="primary"
        size="md"
        rightIcon={Send}
        disabled={disabled || !value.trim()}
      >
        Send
      </Button>
    </form>
  );
}