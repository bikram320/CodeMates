/**
 * ConversationList
 *
 * The sidebar: unread total, a search box and the list of direct
 * conversations. Shows its own empty states (no conversations yet / nothing
 * matches the search).
 *
 * Props:
 *   conversations   {Array}   Already filtered + sorted for display
 *   totalCount      {number}  Conversations before searching
 *   unreadTotal     {number}  Unread messages in un-muted conversations
 *   selectedId      {string|null}
 *   onSelect        {fn}      (conversationId)
 *   search          {string}
 *   onSearchChange  {fn}      (value)
 *   isLoading       {boolean} Show placeholder rows
 *   error           {Error|null}  Show a "couldn't load" state with a retry button
 *   onRetry         {fn}
 */

import { AlertCircle, MessageSquare, RefreshCw, Search, SearchX, X } from 'lucide-react';

import EmptyState from '../ui/EmptyState';
import ConversationItem from './ConversationItem';

function ConversationListSkeleton() {
  return (
    <ul role="status" aria-label="Loading conversations" className="divide-y divide-[#1C1A38]">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} aria-hidden="true" className="flex animate-pulse items-center gap-3 px-4 py-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[#1D1A40]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 rounded bg-[#1D1A40]" />
            <div className="h-3 w-4/5 rounded bg-[#1D1A40]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default function ConversationList({
  conversations = [],
  totalCount = 0,
  unreadTotal = 0,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  isLoading = false,
  error = null,
  onRetry,
}) {
  return (
    <aside aria-label="Conversations" className="flex min-h-0 flex-1 flex-col">
      {/* ── Header + search ─────────────────────────────────────────────── */}
      <div className="border-b border-[#1C1A38] p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-[#F5F5F5]">Conversations</h2>
          {unreadTotal > 0 && (
            <span className="rounded-md bg-[#6C7BFF]/15 px-2 py-0.5 font-mono text-[11px] text-[#8E9BFF]">
              {unreadTotal} unread
            </span>
          )}
        </div>

        <div role="search" className="relative">
          <Search
            size={15}
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6890]"
          />
          <input
            type="text"
            inputMode="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search conversations"
            aria-label="Search conversations"
            className="w-full rounded-lg border border-[#1C1A38] bg-[#0A0918] py-2 pl-9 pr-9 text-base
                       text-[#F5F5F5] placeholder:text-[#6B6890] sm:text-sm
                       transition-colors hover:border-[#2E2A66]
                       focus:border-[#6C7BFF] focus:outline-none focus:ring-2 focus:ring-[#6C7BFF]/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center
                         rounded text-[#6B6890] transition-colors hover:text-[#F5F5F5]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <p className="sr-only" role="status" aria-live="polite">
          {search.trim()
            ? `${conversations.length} ${conversations.length === 1 ? 'conversation' : 'conversations'} found`
            : ''}
        </p>
      </div>

      {/* ── List / empty states ─────────────────────────────────────────── */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <ConversationListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center">
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load conversations"
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
        ) : totalCount === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations yet"
            description="Start a private conversation with a developer from their profile."
          />
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No conversations match"
            description="Try a different name, username or word from a message."
          />
        ) : (
          <ul className="divide-y divide-[#1C1A38]">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                selected={conversation.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}