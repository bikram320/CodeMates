/**
 * DirectMessageInput
 *
 * The composer: an auto-growing textarea and a Send button. Enter sends,
 * Shift+Enter adds a new line. Controlled, so the page can keep a separate
 * draft for each conversation.
 *
 * Props:
 *   value        {string}
 *   onChange     {fn}      (value)
 *   onSend       {fn}      (text)  — trimmed, never empty
 *   placeholder  {string}
 *   focusKey     {any}     When this changes (e.g. the conversation id) the box is
 *                          focused — on large screens only, so phones don't pop the keyboard
 *   maxLength    {number}  default 2000
 *   disabled     {boolean} While the conversation is loading (or failed to load)
 */

import { useEffect, useLayoutEffect, useRef } from 'react';
import { Send } from 'lucide-react';

const MAX_HEIGHT_PX = 140;

export default function DirectMessageInput({
  value,
  onChange,
  onSend,
  placeholder = 'Write a message',
  focusKey,
  maxLength = 2000,
  disabled = false,
}) {
  const textareaRef = useRef(null);

  // Grow with the text, up to about five lines.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT_PX)}px`;
  }, [value]);

  useEffect(() => {
    if (!disabled && window.matchMedia?.('(min-width: 1024px)').matches) {
      textareaRef.current?.focus();
    }
  }, [focusKey, disabled]);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !disabled;

  const submit = () => {
    if (canSend) onSend(trimmed);
  };

  const handleKeyDown = (e) => {
    // Enter sends; Shift+Enter is a new line; don't send while an IME is composing.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const nearLimit = value.length > maxLength * 0.85;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="border-t border-[#1C1A38] p-4 sm:p-5"
    >
      <div className="flex items-end gap-2">
        <label htmlFor="dm-input" className="sr-only">
          Message
        </label>
        <textarea
          ref={textareaRef}
          id="dm-input"
          rows={1}
          value={value}
          maxLength={maxLength}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="max-h-[180px] min-h-[56px] flex-1 resize-none rounded-lg border border-[#2E2A66] bg-[#1D1A40]/50
                     px-4 py-3 text-lg text-[#F5F5F5] placeholder:text-[#6B6890] sm:text-base
                     hover:border-[#3A3580] focus:border-[#6C7BFF] focus:outline-none focus:ring-2 focus:ring-[#6C7BFF]/30
                     disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="Send message"
          className="flex h-[56px] w-[56px] shrink-0 items-center justify-center rounded-lg bg-[#6C7BFF] text-[#0A0918]
                     transition-colors hover:bg-[#8190FF]
                     disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#6C7BFF]
                     focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]"
        >
          <Send size={16} />
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[#6B6890]">
        <span className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
        {nearLimit && (
          <span className={`ml-auto font-mono ${value.length >= maxLength ? 'text-red-300' : ''}`}>
            {value.length}/{maxLength}
          </span>
        )}
      </div>
    </form>
  );
}