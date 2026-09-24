/**
 * DirectMessageList
 *
 * The scrolling message history for one conversation: date separators,
 * grouped bubbles, an optional "new messages" divider, and the empty state
 * for a conversation with no messages yet.
 *
 * Give it `key={conversationId}` so it starts scrolled to the newest message
 * whenever the conversation changes.
 *
 * Props:
 *   messages         {Array}   oldest → newest: { id, senderUserId, content, createdAt, isEdited?, status? }
 *   currentUserId    {string}
 *   participant      {object}  { name, ... } — the other developer
 *   unreadDividerId  {string|null}  Show "N new messages" above this message
 *   isLoading        {boolean} Show placeholder bubbles instead of messages
 *   error            {Error|null}  Show a "couldn't load" state instead of messages
 *   onRetry          {fn}      Retry button in the error state
 *   onDeleteMessage  {fn}      (message) — called from the Delete button on your own messages
 */

import { useEffect, useLayoutEffect, useRef } from 'react';
import { AlertCircle, MessageCircle, RefreshCw } from 'lucide-react';

import EmptyState from '../ui/EmptyState';
import DirectMessageBubble from './DirectMessageBubble';
import { formatDayLabel, isSameDay } from './messagesShared';

const GROUP_GAP_MS = 5 * 60 * 1000;
const NEAR_BOTTOM_PX = 120;

const withinGroupGap = (a, b) =>
  Math.abs(new Date(b.createdAt) - new Date(a.createdAt)) <= GROUP_GAP_MS;

/** Turn messages into rows: day separators, the unread divider, and bubbles. */
function buildRows(messages, unreadDividerId, currentUserId) {
  const rows = [];

  messages.forEach((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];

    const newDay = !prev || !isSameDay(prev.createdAt, message.createdAt);
    const hasDivider = message.id === unreadDividerId;

    if (newDay) {
      rows.push({ type: 'day', key: `day-${message.id}`, label: formatDayLabel(message.createdAt) });
    }
    if (hasDivider) {
      const unread = messages.slice(i).filter((m) => m.senderUserId !== currentUserId).length;
      rows.push({ type: 'unread', key: 'unread-divider', count: unread });
    }

    const startsGroup =
      newDay ||
      hasDivider ||
      prev.senderUserId !== message.senderUserId ||
      !withinGroupGap(prev, message);

    const endsGroup =
      !next ||
      next.senderUserId !== message.senderUserId ||
      !isSameDay(message.createdAt, next.createdAt) ||
      next.id === unreadDividerId ||
      !withinGroupGap(message, next);

    rows.push({ type: 'message', key: message.id, message, startsGroup, endsGroup });
  });

  return rows;
}

function MessageListSkeleton() {
  const widths = ['w-2/5', 'w-1/2', 'w-1/3', 'w-3/5', 'w-2/5'];
  return (
    <div
      role="status"
      aria-label="Loading messages"
      className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden px-4 py-4"
    >
      {widths.map((width, i) => (
        <div
          key={i}
          aria-hidden="true"
          className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
        >
          <div className={`h-10 ${width} animate-pulse rounded-2xl bg-[#1D1A40]`} />
        </div>
      ))}
    </div>
  );
}

export default function DirectMessageList({
  messages = [],
  currentUserId,
  participant,
  unreadDividerId = null,
  isLoading = false,
  error = null,
  onRetry,
  onDeleteMessage,
}) {
  const scrollerRef = useRef(null);
  const nearBottomRef = useRef(true);
  const lastMessageId = messages[messages.length - 1]?.id;
  const firstRunRef = useRef(true);

  // Start at the newest message — once the list is actually on screen
  // (it isn't while the messages are still loading).
  const showingMessages = !isLoading && !error && messages.length > 0;
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [showingMessages]);

  // Follow new messages — always for your own, and for theirs if you were already at the bottom.
  useEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      return;
    }
    const el = scrollerRef.current;
    if (!el) return;

    const lastIsOwn = messages[messages.length - 1]?.senderUserId === currentUserId;
    if (lastIsOwn || nearBottomRef.current) {
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      el.scrollTo({ top: el.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastMessageId]);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    nearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  if (isLoading) return <MessageListSkeleton />;

  if (error) {
    return (
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto p-4">
        <EmptyState
          icon={AlertCircle}
          title="Couldn't load this conversation"
          description={error.message || 'Something went wrong. Try again.'}
        />
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium
                       text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        )}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-4">
        <EmptyState
          icon={MessageCircle}
          title="No messages yet"
          description={`Say hi to ${participant.name.split(' ')[0]}. This conversation is private between the two of you.`}
        />
      </div>
    );
  }

  const rows = buildRows(messages, unreadDividerId, currentUserId);

  return (
    <div
      ref={scrollerRef}
      onScroll={handleScroll}
      role="log"
      aria-label={`Conversation with ${participant.name}`}
      tabIndex={0}
      className="min-h-0 flex-1 overflow-y-auto px-5 py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6C7BFF]/40"
    >
      {rows.map((row) => {
        if (row.type === 'day') {
          return (
            <div key={row.key} className="my-4 flex items-center gap-3 first:mt-0">
              <span className="h-px flex-1 bg-[#1C1A38]" aria-hidden="true" />
              <span className="rounded-full bg-[#1D1A40] px-3 py-1.5 text-xs font-medium text-[#8B88AE]">
                {row.label}
              </span>
              <span className="h-px flex-1 bg-[#1C1A38]" aria-hidden="true" />
            </div>
          );
        }

        if (row.type === 'unread') {
          return (
            <div key={row.key} className="my-4 flex items-center gap-3" role="separator">
              <span className="h-px flex-1 bg-[#C9A8FF]/30" aria-hidden="true" />
              <span className="text-xs font-medium text-[#C9A8FF]">
                {row.count} new {row.count === 1 ? 'message' : 'messages'}
              </span>
              <span className="h-px flex-1 bg-[#C9A8FF]/30" aria-hidden="true" />
            </div>
          );
        }

        return (
          <div key={row.key} className={row.startsGroup ? 'mt-3 first:mt-0' : 'mt-0.5'}>
            <DirectMessageBubble
              message={row.message}
              isOwn={row.message.senderUserId === currentUserId}
              senderName={participant.name}
              endsGroup={row.endsGroup}
              onDelete={onDeleteMessage}
            />
          </div>
        );
      })}
    </div>
  );
}