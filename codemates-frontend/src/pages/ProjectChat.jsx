import { useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import ConversationList from "../components/chat/ConversationList";
import ChatHeader from "../components/chat/ChatHeader";
import MessageList from "../components/chat/MessageList";
import TypingIndicator from "../components/chat/TypingIndicator";
import MessageInput from "../components/chat/MessageInput";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

import { chatUsers, CURRENT_USER_ID, presence } from "../mock/chatMock";
import { projectDetails, defaultProjectDetails } from "../mock/projectDetailsMock";
import { useProjectChat } from "../hooks/useProjectChat";

/**
 * Project Chat page (/projects/:projectId/chat).
 *
 * Data flow: this page -> useProjectChat(projectId) -> chatApi.js ->
 * chatMock.js (see hooks/useProjectChat.js and api/chatApi.js — the
 * latter documents exactly where each function diverges from the real
 * messaging-service API, since a couple of them are structurally
 * different, not just pointed at mock data).
 *
 * chatUsers/CURRENT_USER_ID/presence are still imported directly here
 * rather than through the hook — they're reference/session data (a user
 * directory, "who am I"), not something being fetched as a resource.
 */
export default function ProjectChat() {
  const { projectId } = useParams();

  const project = projectDetails[projectId] ?? defaultProjectDetails;

  const {
    conversations,
    isLoadingConversations,
    isConversationsError,
    activeConversationId,
    setActiveConversationId,
    messages: activeMessages,
    isLoadingMessages,
    isMessagesError,
    messagesError,
    sendMessage,
  } = useProjectChat(projectId);

  const [typingUsers, setTypingUsers] = useState([]);

  // Neither ConversationResponse shape (PROJECT or DIRECT) carries a
  // display name — resolved from project data or the user directory,
  // exactly as a real integration would need to.
  function resolveConversationDisplay(conversation) {
    if (conversation.type === "PROJECT") {
      const conversationProject =
        projectDetails[conversation.projectId] ?? defaultProjectDetails;
      return {
        displayName: conversationProject.name,
        displayAvatar: null,
        isGroup: true,
        isOnline: false,
      };
    }

    const otherUserId = conversation.participants.find(
      (p) => p.userId !== CURRENT_USER_ID
    )?.userId;
    const other = chatUsers[otherUserId];

    return {
      displayName: other?.name ?? "Unknown",
      displayAvatar: other?.avatarUrl ?? null,
      isGroup: false,
      isOnline: presence[otherUserId] === "ONLINE",
    };
  }

  const enrichedConversations = conversations.map((conversation) => {
    const self = conversation.participants.find((p) => p.userId === CURRENT_USER_ID);
    const unread =
      !!conversation.lastMessageAt &&
      (!self?.lastReadAt || new Date(self.lastReadAt) < new Date(conversation.lastMessageAt));

    return {
      ...conversation,
      ...resolveConversationDisplay(conversation),
      unread,
    };
  });

  const activeConversation = enrichedConversations.find(
    (c) => c.id === activeConversationId
  );

  let headerSubtitle = "";
  if (activeConversation?.isGroup) {
    const onlineCount = activeConversation.participants.filter(
      (p) => presence[p.userId] === "ONLINE"
    ).length;
    headerSubtitle = `${activeConversation.participants.length} members · ${onlineCount} online`;
  } else if (activeConversation) {
    headerSubtitle = activeConversation.isOnline ? "Online" : "Offline";
  }

  function handleSend(content) {
    sendMessage(content);

    // Mock-only: briefly show a typing indicator after sending, so the
    // component is visibly exercised without a real WebSocket. Replace
    // with a /topic/conversations/{id}/typing subscription later.
    if (activeConversation && !activeConversation.isGroup) {
      const other = chatUsers[
        activeConversation.participants.find((p) => p.userId !== CURRENT_USER_ID)?.userId
      ];
      if (other) {
        setTypingUsers([other.name]);
        setTimeout(() => setTypingUsers([]), 2000);
      }
    }
  }

  if (isLoadingConversations) {
    return (
      <div className="flex h-[calc(100vh-var(--cm-navbar-h)-4rem)] items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isConversationsError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load conversations"
        description="Something went wrong loading this project's chat. Please try again."
      />
    );
  }

  return (
    <div className="project-chat-page flex h-[calc(100vh-var(--cm-navbar-h)-4rem)] overflow-hidden rounded-lg border border-[var(--cm-border)]">
      <ConversationList
        conversations={enrichedConversations}
        activeConversationId={activeConversationId}
        onSelect={setActiveConversationId}
        className="hidden w-72 shrink-0 sm:flex"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {activeConversation && (
          <ChatHeader
            title={activeConversation.displayName}
            subtitle={headerSubtitle}
            avatarUrl={activeConversation.displayAvatar}
            isGroup={activeConversation.isGroup}
          />
        )}

        {isLoadingMessages ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner size="lg" />
          </div>
        ) : isMessagesError ? (
          <div className="flex flex-1 items-center justify-center p-6">
            <EmptyState
              icon={AlertTriangle}
              title="Couldn't load messages"
              description={messagesError?.message || "Please try again."}
            />
          </div>
        ) : (
          <MessageList
            messages={activeMessages}
            currentUserId={CURRENT_USER_ID}
            userDirectory={chatUsers}
          />
        )}

        <TypingIndicator typingUsers={typingUsers} />

        <MessageInput onSend={handleSend} />
      </div>
    </div>
  );
}