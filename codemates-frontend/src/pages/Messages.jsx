import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Check, Info, MessageSquare } from "lucide-react";

import ConversationList from "../components/messages/ConversationList";
import DirectMessageHeader from "../components/messages/DirectMessageHeader";
import DirectMessageList from "../components/messages/DirectMessageList";
import DirectMessageInput from "../components/messages/DirectMessageInput";
import { ConfirmDialog } from "../components/projectSettings/projectSettingsShared";
import EmptyState from "../components/ui/EmptyState";

import useMessages from "../hooks/useMessages";

/**
 * Direct Messages page (/messages).
 *
 * Private one-to-one conversations between developers. (Project Chat is a
 * separate feature and isn't touched here.)
 *
 * ⚠️ MOCK DATA ONLY. Data comes from useMessages() → messagesApi → mock data;
 * there's no backend call and no WebSocket yet, so nothing is sent anywhere
 * and replies never arrive on their own. Sending, deleting (after a
 * confirmation), marking read and muting all work against the mock data.
 */

const getErrorMessage = (err) =>
  err?.message || "Something went wrong. Try again.";

const byRecentActivity = (a, b) => {
  if (!a.lastMessageAt && !b.lastMessageAt) return a.participant.name.localeCompare(b.participant.name);
  if (!a.lastMessageAt) return 1;
  if (!b.lastMessageAt) return -1;
  return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
};

const excerpt = (text, max = 80) =>
  text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

export default function Messages() {
  const {
    conversations,
    isLoadingConversations,
    conversationsError,
    isEmpty,
    refetchConversations,
    selectedConversation,
    selectConversation,
    clearSelection,
    messages,
    isLoadingMessages,
    messagesError,
    refetchMessages,
    unreadDividerId,
    sendMessage,
    deleteMessage,
    setConversationMuted,
    currentUserId,
  } = useMessages();

  const [drafts, setDrafts] = useState({});
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null); // message awaiting confirmation
  const [notice, setNotice] = useState(null); // { text, tone: 'success' | 'error' }

  /* Auto-dismiss the toast (errors stay a little longer) */
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(
      () => setNotice(null),
      notice.tone === "error" ? 6000 : 4000
    );
    return () => clearTimeout(timer);
  }, [notice]);

  const notify = (text, tone = "success") => setNotice({ text, tone });

  const list = conversations ?? [];

  const visibleConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (conversations ?? [])
      .filter(
        (c) =>
          !query ||
          c.participant.name.toLowerCase().includes(query) ||
          c.participant.username.toLowerCase().includes(query) ||
          (c.lastMessagePreview ?? "").toLowerCase().includes(query)
      )
      .sort(byRecentActivity);
  }, [conversations, search]);

  const unreadTotal = list.reduce(
    (sum, c) => (c.isMuted ? sum : sum + c.unreadCount),
    0
  );

  /* ── Actions ───────────────────────────────────────────────────────────── */

  const handleSend = async (text) => {
    if (!selectedConversation) return;
    const conversationId = selectedConversation.id;

    setDrafts((prev) => ({ ...prev, [conversationId]: "" }));
    try {
      await sendMessage(text);
    } catch (err) {
      // The message was taken back out of the thread — put the text back so it isn't lost.
      setDrafts((prev) => ({
        ...prev,
        [conversationId]: prev[conversationId]
          ? `${text}\n${prev[conversationId]}`
          : text,
      }));
      notify(getErrorMessage(err), "error");
    }
  };

  const handleConfirmDelete = async () => {
    const target = deleteTarget;
    setDeleteTarget(null);
    if (!target) return;
    try {
      await deleteMessage(target.id);
      notify("Message deleted.");
    } catch (err) {
      notify(getErrorMessage(err), "error");
    }
  };

  const handleToggleMute = async () => {
    if (!selectedConversation) return;
    try {
      await setConversationMuted(
        selectedConversation.id,
        !selectedConversation.isMuted
      );
    } catch (err) {
      notify(getErrorMessage(err), "error");
    }
  };

  const selected = selectedConversation;

  /* ── Render ────────────────────────────────────────────────────────────── */

  return (
    <div className="messages-page">
      {/* Title is hidden on small screens while a conversation is open, to give it the room */}
      <div className={`head-container ${selected ? "hidden lg:block" : ""}`}>
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Messages</h1>
        <p className="mt-1 text-sm text-[#8B88AE]">
          Private conversations with other developers.
        </p>
      </div>

      <div
        role="note"
        className={`mt-4 items-start gap-2.5 rounded-xl border border-[#C9A8FF]/25 bg-[#C9A8FF]/5 px-4 py-3 ${
          selected ? "hidden lg:flex" : "flex"
        }`}
      >
        <Info size={15} className="mt-0.5 shrink-0 text-[#C9A8FF]" />
        <p className="text-xs leading-relaxed text-[#A9A6C8]">
          <span className="font-medium text-[#F5F5F5]">Sample data.</span>{" "}
          These conversations are mock values. Messages aren&apos;t sent anywhere yet.
        </p>
      </div>

      <div className="body-container mt-4 flex h-[calc(100vh-14rem)] min-h-[520px] overflow-hidden rounded-xl border border-[#1C1A38] bg-[#0A0918]">
        {/* ── Conversation list ───────────────────────────────────────────── */}
        <div
          className={`min-h-0 w-full flex-col border-[#1C1A38] lg:flex lg:w-[340px] lg:shrink-0 lg:border-r ${
            selected ? "hidden" : "flex"
          }`}
        >
          <ConversationList
            conversations={visibleConversations}
            totalCount={list.length}
            unreadTotal={unreadTotal}
            selectedId={selected?.id ?? null}
            onSelect={selectConversation}
            search={search}
            onSearchChange={setSearch}
            isLoading={isLoadingConversations}
            error={conversationsError}
            onRetry={() => refetchConversations()}
          />
        </div>

        {/* ── Open conversation ───────────────────────────────────────────── */}
        <section
          aria-label="Conversation"
          className={`min-h-0 min-w-0 flex-1 flex-col lg:flex ${selected ? "flex" : "hidden"}`}
        >
          {selected ? (
            <>
              <DirectMessageHeader
                participant={selected.participant}
                isMuted={selected.isMuted}
                onToggleMute={handleToggleMute}
                onBack={clearSelection}
              />

              <DirectMessageList
                key={selected.id}
                messages={messages}
                currentUserId={currentUserId}
                participant={selected.participant}
                unreadDividerId={unreadDividerId}
                isLoading={isLoadingMessages}
                error={messagesError}
                onRetry={() => refetchMessages()}
                onDeleteMessage={setDeleteTarget}
              />

              <DirectMessageInput
                value={drafts[selected.id] ?? ""}
                onChange={(value) =>
                  setDrafts((prev) => ({ ...prev, [selected.id]: value }))
                }
                onSend={handleSend}
                placeholder={`Message ${selected.participant.name.split(" ")[0]}`}
                focusKey={selected.id}
                disabled={isLoadingMessages || Boolean(messagesError)}
              />
            </>
          ) : (
            /* Nothing selected */
            <div className="flex flex-1 items-center justify-center p-4">
              <EmptyState
                icon={MessageSquare}
                title={isEmpty ? "No conversation selected" : "Select a conversation"}
                description={
                  isEmpty
                    ? "Once you start a conversation with a developer, it will show up here."
                    : "Choose a developer from the list to read your messages, or search to find someone."
                }
              />
            </div>
          )}
        </section>
      </div>

      {/* ── Delete confirmation ───────────────────────────────────────────── */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        tone="danger"
        title="Delete this message?"
        description={
          deleteTarget
            ? `“${excerpt(deleteTarget.content)}” will be removed from this conversation for both of you. This can’t be undone.`
            : ""
        }
        confirmLabel="Delete message"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          aria-live={notice.tone === "error" ? "assertive" : "polite"}
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-sm items-center gap-2.5 rounded-xl
                     border border-[#2E2A66] bg-[#0F0E24] px-4 py-3 text-sm text-[#F5F5F5]
                     shadow-xl shadow-black/50 sm:left-auto sm:right-6 sm:mx-0"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              notice.tone === "error"
                ? "bg-red-400/20 text-red-300"
                : "bg-[#6C7BFF]/20 text-[#8E9BFF]"
            }`}
          >
            {notice.tone === "error" ? <AlertCircle size={12} /> : <Check size={12} />}
          </span>
          {notice.text}
        </div>
      )}
    </div>
  );
}