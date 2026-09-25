import { useEffect, useRef } from "react";
import { MessagesSquare } from "lucide-react";
import MessageBubble from "./MessageBubble";
import EmptyState from "../ui/EmptyState";
import Button from "../ui/Button";

/**
 * Scrollable message history for the active conversation.
 *
 * Props:
 * - messages         MessageResponse[]
 * - currentUserId    determines which bubbles render as "own"
 * - userDirectory    { [userId]: { name, avatarUrl } } — empty until
 *                     user-profile-service is available
 * - hasMore          boolean — shows the "Load earlier messages" button
 * - onLoadMore       () => void
 * - onEditMessage    (id, content) => void — omit to disable editing
 * - onDeleteMessage  (id) => void — omit to disable deleting
 */
export default function MessageList({
  messages = [],
  currentUserId,
  userDirectory = {},
  hasMore = false,
  onLoadMore,
  onEditMessage,
  onDeleteMessage,
  className = "",
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className={`flex flex-1 items-center justify-center p-6 ${className}`}>
        <EmptyState
          icon={MessagesSquare}
          title="No messages yet"
          description="Say hello to get the conversation started."
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-1 flex-col gap-4 overflow-y-auto p-5 ${className}`}>
      {hasMore && onLoadMore && (
        <Button variant="ghost" size="sm" onClick={onLoadMore} className="mx-auto">
          Load earlier messages
        </Button>
      )}

      {messages.map((message) => {
        const sender = userDirectory[message.senderUserId];
        const isOwn = message.senderUserId === currentUserId;

        return (
          <MessageBubble
            key={message.id}
            id={message.id}
            content={message.content}
            createdAt={message.createdAt}
            isEdited={message.isEdited}
            isOwn={isOwn}
            senderName={sender?.name}
            senderAvatarUrl={sender?.avatarUrl}
            onEdit={isOwn ? onEditMessage : undefined}
            onDelete={isOwn ? onDeleteMessage : undefined}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}