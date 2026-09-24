/**
 * ConversationItem
 *
 * One row in the conversation list: avatar with online dot, name, time of the
 * last message, a one-line preview and an unread badge.
 *
 * Props:
 *   conversation {object}
 *     id, isMuted, unreadCount, lastMessageAt, lastMessagePreview,
 *     lastMessageFromMe (boolean),
 *     participant { name, username, avatarUrl, presence: 'ONLINE' | 'OFFLINE' }
 *   selected     {boolean}
 *   onSelect     {fn}   (conversationId)
 */

import { BellOff } from 'lucide-react';

import { DeveloperAvatar, formatListTime } from './messagesShared';

export default function ConversationItem({ conversation, selected, onSelect }) {
  const { participant, unreadCount, isMuted, lastMessagePreview, lastMessageAt } = conversation;
  const hasUnread = unreadCount > 0;

  const preview = lastMessagePreview
    ? `${conversation.lastMessageFromMe ? 'You: ' : ''}${lastMessagePreview}`
    : 'No messages yet';

  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(conversation.id)}
        aria-current={selected ? 'true' : undefined}
        className={`flex w-full items-center gap-4 border-l-2 px-5 py-4 text-left transition-colors duration-150
                    focus:outline-none focus-visible:bg-[#1D1A40] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6C7BFF]/60 ${
                      selected
                        ? 'border-[#6C7BFF] bg-[#6C7BFF]/10'
                        : 'border-transparent hover:bg-[#1D1A40]/60'
                    }`}
      >
        <DeveloperAvatar
          name={participant.name}
          username={participant.username}
          avatarUrl={participant.avatarUrl}
          presence={participant.presence}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`truncate text-base ${
                hasUnread ? 'font-semibold text-[#F5F5F5]' : 'font-medium text-[#DAD8EE]'
              }`}
            >
              {participant.name}
              <span className="sr-only">
                , {participant.presence === 'ONLINE' ? 'online' : 'offline'}
              </span>
            </span>
            {lastMessageAt && (
              <time
                dateTime={lastMessageAt}
                className={`shrink-0 text-[11px] ${hasUnread ? 'text-[#C9A8FF]' : 'text-[#6B6890]'}`}
              >
                {formatListTime(lastMessageAt)}
              </time>
            )}
          </div>

          <div className="mt-0.5 flex items-center justify-between gap-2">
            <p
              className={`truncate text-sm ${
                lastMessagePreview
                  ? hasUnread
                    ? 'text-[#C9C7E0]'
                    : 'text-[#8B88AE]'
                  : 'italic text-[#6B6890]'
              }`}
            >
              {preview}
            </p>

            <span className="flex shrink-0 items-center gap-1.5">
              {isMuted && (
                <BellOff size={12} aria-label="Muted" className="text-[#6B6890]" />
              )}
              {hasUnread && (
                <span
                  className={`inline-flex h-6 min-w-[24px] items-center justify-center rounded-full px-1.5
                              text-xs font-bold ${
                                isMuted ? 'bg-[#2E2A66] text-[#C9A8FF]' : 'bg-[#6C7BFF] text-[#0A0918]'
                              }`}
                >
                  <span aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span>
                  <span className="sr-only">
                    {unreadCount} unread {unreadCount === 1 ? 'message' : 'messages'}
                  </span>
                </span>
              )}
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}