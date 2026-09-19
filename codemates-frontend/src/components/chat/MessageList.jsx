import { useEffect, useRef } from "react";
import { MessagesSquare } from "lucide-react";
import MessageBubble from "./MessageBubble";
import EmptyState from "../ui/EmptyState";

/**
 * Scrollable message history for the active conversation. Resolves each
 * message's sender from userDirectory (senderUserId -> { name, avatarUrl })
 * since MessageResponse itself carries no sender display info.
 *
 * Props:
 * - messages         MessageResponse[]
 * - currentUserId    string — determines which bubbles render as "own"
 * - userDirectory    { [userId]: { name, avatarUrl } }
 */
export default function MessageList({
  messages = [],
  currentUserId,
  userDirectory = {},
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
      {messages.map((message) => {
        const sender = userDirectory[message.senderUserId];
        return (
          <MessageBubble
            key={message.id}
            content={message.content}
            createdAt={message.createdAt}
            isEdited={message.isEdited}
            isOwn={message.senderUserId === currentUserId}
            senderName={sender?.name}
            senderAvatarUrl={sender?.avatarUrl}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}