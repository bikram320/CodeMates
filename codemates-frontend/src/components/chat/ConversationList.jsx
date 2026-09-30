import ConversationItem from "./ConversationItem";
import { MessageSquare } from "lucide-react";

/**
 * Sidebar listing all of the user's conversations. Purely presentational —
 * expects an array of already-enriched conversation objects (see
 * ProjectChat.jsx for how displayName/avatarUrl/isOnline get resolved).
 *
 * Props:
 * - conversations         enriched conversation objects (see ConversationItem)
 * - activeConversationId  string
 * - onSelect              (conversationId) => void
 */
export default function ConversationList({
  conversations = [],
  activeConversationId,
  onSelect,
  className = "",
}) {
  return (
    <div
      className={`flex h-full flex-col border-r border-[var(--cm-border)] ${className}`}
    >
      <div className="flex h-[69px] items-center gap-3 border-b border-[#6366F1] bg-[#6366F1] px-4">
        <MessageSquare size={24} className="shrink-0 !text-white" aria-hidden="true" />
        <h2 className="text-xl font-semibold !text-white">Messages</h2>
      </div>

      <div className={`flex h-full flex-col border-r border-[var(--cm-border)] bg-white ${className}`}>
        {conversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-[var(--cm-muted)]">
            No conversations yet.
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            {conversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                displayName={conversation.displayName}
                avatarUrl={conversation.displayAvatar}
                isGroup={conversation.isGroup}
                lastMessagePreview={conversation.lastMessagePreview}
                isOnline={conversation.isOnline}
                unread={conversation.unread}
                active={conversation.id === activeConversationId}
                onClick={() => onSelect(conversation.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}