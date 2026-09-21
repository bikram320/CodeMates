import ConversationItem from "./ConversationItem";

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
      <div className="border-b border-[var(--cm-border)] px-4 py-4">
        <h2 className="text-sm font-semibold text-[var(--cm-text)]">
          Conversations
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
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