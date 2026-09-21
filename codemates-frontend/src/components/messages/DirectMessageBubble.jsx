/**
 * DirectMessageBubble
 *
 * A single message. The sender's bubbles sit on the right in indigo, the
 * other developer's on the left. Text is plain (whitespace preserved); only
 * `inline code` spans get special styling, and nothing is ever rendered as HTML.
 *
 * Props:
 *   message      {object}  { id, content, createdAt, isEdited?, status? }
 *                          status 'sending' → shown faded with "Sending…"
 *   isOwn        {boolean}
 *   senderName   {string}  Read out by screen readers ("Mia Chen said: …")
 *   endsGroup    {boolean} Last bubble of a run — gets the small "tail" corner
 *   onDelete     {fn}      (message) — your own messages only. Shows a Delete button
 *                          (on hover / focus on large screens, always on small ones);
 *                          the page is expected to ask for confirmation.
 */

import { Trash2 } from 'lucide-react';

import { formatMessageTime } from './messagesShared';

/** Split on `backtick` spans; everything else stays text. */
function renderContent(content, isOwn) {
  return content.split(/(`[^`\n]+`)/g).map((part, i) => {
    if (part.length > 2 && part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className={`rounded px-1 py-0.5 font-mono text-[0.85em] ${
            isOwn ? 'bg-[#0A0918]/15 text-[#0A0918]' : 'bg-[#0A0918] text-[#C9A8FF]'
          }`}
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export default function DirectMessageBubble({
  message,
  isOwn,
  senderName,
  endsGroup = true,
  onDelete,
}) {
  const pending = message.status === 'sending';
  const time = formatMessageTime(message.createdAt);
  const fullDate = new Date(message.createdAt).toLocaleString();

  return (
    <div className={`group flex items-center gap-1.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {isOwn && onDelete && !pending && (
        <button
          type="button"
          onClick={() => onDelete(message)}
          aria-label="Delete message"
          title="Delete message"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[#6B6890]
                     transition-opacity hover:bg-[#1D1A40] hover:text-red-300
                     focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60
                     lg:opacity-0 lg:group-hover:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed sm:max-w-[70%] ${
          pending ? 'opacity-70' : ''
        } ${
          isOwn
            ? `bg-[#6C7BFF] text-[#0A0918] ${endsGroup ? 'rounded-br-md' : ''}`
            : `border border-[#2E2A66] bg-[#1D1A40] text-[#F5F5F5] ${endsGroup ? 'rounded-bl-md' : ''}`
        }`}
      >
        <span className="sr-only">{isOwn ? 'You' : senderName} said: </span>
        <p className="whitespace-pre-wrap break-words">{renderContent(message.content, isOwn)}</p>

        <div
          className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] ${
            isOwn ? 'text-[#0A0918]/70' : 'text-[#8B88AE]'
          }`}
        >
          {message.isEdited && <span>edited</span>}
          {pending ? (
            <span>Sending…</span>
          ) : (
            <time dateTime={message.createdAt} title={fullDate}>
              {time}
            </time>
          )}
        </div>
      </div>
    </div>
  );
}