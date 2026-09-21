/**
 * "X is typing…" indicator with animated dots. Renders nothing when no
 * one is typing, so it can be dropped in unconditionally.
 *
 * Props:
 * - typingUsers   string[] — display names of who's currently typing
 */
export default function TypingIndicator({ typingUsers = [], className = "" }) {
  if (typingUsers.length === 0) return null;

  const label =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing`
      : `${typingUsers.join(", ")} are typing`;

  return (
    <div
      className={`flex items-center gap-2 px-5 pb-2 text-xs text-[var(--cm-muted)] ${className}`}
    >
      <span>{label}</span>
      <span className="flex items-center gap-0.5">
        <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--cm-muted)] [animation-delay:-0.3s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--cm-muted)] [animation-delay:-0.15s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-[var(--cm-muted)]" />
      </span>
    </div>
  );
}