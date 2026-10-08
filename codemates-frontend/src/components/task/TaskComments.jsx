/**
 * TaskComments
 *
 * Comment thread for a single task — rendered inside TaskModal in edit
 * mode only (a task must already exist server-side to have comments).
 *
 * Permissions mirror TaskCommentService.java exactly:
 *   - anyone can read
 *   - any project member can add a comment
 *   - only the comment's author can edit it
 *   - the author OR the project's LEADER can delete it
 *
 * TaskCommentResponse only has authorUserId, no name — resolved via
 * useUserDirectory, same pattern as TaskCard/TaskFilters/TaskModal.
 *
 * Props:
 *   projectId      {string}
 *   taskId         {string}
 *   currentUserId  {string|null}
 *   isLeader       {boolean}   whether currentUserId is this project's LEADER
 */

import { useMemo, useState } from 'react';
import { AlertCircle, Loader2, MessageSquare, Pencil, Send, Trash2 } from 'lucide-react';
import { useTaskComments } from '../../hooks/useTaskComments';
import useUserDirectory from '../../hooks/useUserDirectory';

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function CommentRow({ comment, profile, canEdit, canDelete, onSave, onDelete, isSaving, isDeleting }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  const displayName = profile?.fullName || profile?.username || `${comment.authorUserId.slice(0, 8)}…`;

  function submitEdit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === comment.content) {
      setEditing(false);
      setDraft(comment.content);
      return;
    }
    onSave(comment.id, trimmed, () => setEditing(false));
  }

  return (
      <div className="flex gap-2.5">
        <div className="w-6 h-6 rounded-full bg-[#1D1A40] border border-[#2E2A66] flex items-center justify-center text-[10px] font-bold text-[#6C7BFF] shrink-0 select-none">
          {displayName.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="text-xs font-medium text-[#F5F5F5]">{displayName}</span>
            <span className="text-[10px] text-[#6B6890]">
            {timeAgo(comment.createdAt)}
              {comment.isEdited ? ' · edited' : ''}
          </span>
          </div>

          {editing ? (
              <div className="mt-1 space-y-1.5">
            <textarea
                autoFocus
                rows={2}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="w-full bg-[#0A0918] border border-[#2E2A66] text-[#F5F5F5] text-xs px-2.5 py-2
                         rounded-lg outline-none focus:border-[#6C7BFF] resize-none"
            />
                <div className="flex gap-3">
                  <button
                      type="button"
                      onClick={submitEdit}
                      disabled={isSaving}
                      className="text-[11px] text-[#6C7BFF] hover:text-[#8190FF] font-medium disabled:opacity-50"
                  >
                    {isSaving ? 'Saving…' : 'Save'}
                  </button>
                  <button
                      type="button"
                      onClick={() => {
                        setEditing(false);
                        setDraft(comment.content);
                      }}
                      className="text-[11px] text-[#6B6890] hover:text-[#F5F5F5]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
          ) : (
              <p className="text-xs text-[#C9C6E8] leading-relaxed mt-0.5 whitespace-pre-wrap break-words">
                {comment.content}
              </p>
          )}

          {!editing && (canEdit || canDelete) && (
              <div className="flex gap-3 mt-1">
                {canEdit && (
                    <button
                        type="button"
                        onClick={() => setEditing(true)}
                        className="text-[10px] text-[#6B6890] hover:text-[#F5F5F5] flex items-center gap-1"
                    >
                      <Pencil size={10} /> Edit
                    </button>
                )}
                {canDelete && (
                    <button
                        type="button"
                        onClick={() => onDelete(comment.id)}
                        disabled={isDeleting}
                        className="text-[10px] text-[#6B6890] hover:text-[#EF4444] flex items-center gap-1 disabled:opacity-50"
                    >
                      {isDeleting ? <Loader2 size={10} className="animate-spin" /> : <Trash2 size={10} />}
                      Delete
                    </button>
                )}
              </div>
          )}
        </div>
      </div>
  );
}

export default function TaskComments({ projectId, taskId, currentUserId, isLeader }) {
  const { comments, isLoading, isError, addComment, isAdding, updateComment, deleteComment } =
      useTaskComments(projectId, taskId);

  const [draft, setDraft] = useState('');
  const [addError, setAddError] = useState(null);
  const [busy, setBusy] = useState(null); // { id, action: 'edit' | 'delete' } | null

  const authorIds = useMemo(() => [...new Set(comments.map((c) => c.authorUserId))], [comments]);
  const { directory } = useUserDirectory(authorIds);

  // NOTE: deliberately not a <form onSubmit> — this component renders
  // inside TaskModal's own <form> (the Create/Edit Task form), and nested
  // <form> elements are invalid HTML. Browsers handle that inconsistently,
  // and here it meant clicking "send" bypassed React's handler and did a
  // native form submit, reloading the page instead of posting the
  // comment. A plain button click + Enter-to-submit avoids the nesting
  // entirely.
  function handleAdd() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setAddError(null);
    addComment(trimmed, {
      onSuccess: () => setDraft(''),
      onError: (err) => setAddError(err?.message || 'Could not post comment.'),
    });
  }

  function handleSaveEdit(commentId, content, onDone) {
    setBusy({ id: commentId, action: 'edit' });
    updateComment(
        { commentId, content },
        { onSuccess: onDone, onSettled: () => setBusy(null) }
    );
  }

  function handleDelete(commentId) {
    setBusy({ id: commentId, action: 'delete' });
    deleteComment(commentId, { onSettled: () => setBusy(null) });
  }

  return (
      <div>
        <label className="flex items-center gap-1.5 text-xs text-[#A7A3D6] mb-2 font-medium">
          <MessageSquare size={12} />
          Comments{comments.length > 0 ? ` (${comments.length})` : ''}
        </label>

        <div className="space-y-3 max-h-56 overflow-y-auto pr-1 mb-3">
          {isLoading && <p className="text-[11px] text-[#6B6890]">Loading comments…</p>}
          {isError && <p className="text-[11px] text-[#EF4444]">Couldn't load comments.</p>}
          {!isLoading && !isError && comments.length === 0 && (
              <p className="text-[11px] text-[#6B6890]">No comments yet.</p>
          )}
          {comments.map((c) => (
              <CommentRow
                  key={c.id}
                  comment={c}
                  profile={directory[c.authorUserId]}
                  canEdit={c.authorUserId === currentUserId}
                  canDelete={c.authorUserId === currentUserId || isLeader}
                  onSave={handleSaveEdit}
                  onDelete={handleDelete}
                  isSaving={busy?.id === c.id && busy.action === 'edit'}
                  isDeleting={busy?.id === c.id && busy.action === 'delete'}
              />
          ))}
        </div>

        <div className="flex gap-2">
          <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAdd();
                }
              }}
              placeholder="Add a comment…"
              className="flex-1 bg-[#0A0918] border border-[#26224A] text-[#F5F5F5] text-xs px-3 py-2
                     rounded-lg outline-none focus:border-[#6C7BFF] transition-colors"
          />
          <button
              type="button"
              onClick={handleAdd}
              disabled={isAdding || !draft.trim()}
              className="shrink-0 px-3 py-2 rounded-lg bg-[#6C7BFF] text-[#0A0918]
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-[#8190FF]"
          >
            {isAdding ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          </button>
        </div>
        {addError && (
            <p className="flex items-center gap-1 text-[10px] text-[#EF4444] mt-1.5">
              <AlertCircle size={10} />
              {addError}
            </p>
        )}
      </div>
  );
}