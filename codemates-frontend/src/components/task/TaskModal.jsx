/**
 * TaskModal
 *
 * Create / edit task modal — aligned with the real Spring Boot API.
 *
 * Key differences from the mock version:
 *
 *   CREATE mode  → status field is HIDDEN.
 *     The backend always creates tasks as TODO (CreateTaskRequest has no status).
 *     Showing it would be misleading.
 *
 *   EDIT mode    → status field IS shown.
 *     The parent (ProjectTasks.jsx) routes status changes through the separate
 *     changeStatus() mutation → PUT /tasks/{taskId}/status.
 *     This modal just collects the value; the split is handled upstream.
 *
 *   dueDate:
 *     Backend sends/receives Instant (ISO-8601 string, e.g. "2026-09-20T00:00:00Z").
 *     HTML date input expects "YYYY-MM-DD".
 *     toDateInput() / toInstant() from taskApi.js handle the conversion.
 *
 *   Assignee dropdown:
 *     Populated from GET /api/projects/{projectId}/members → ProjectMemberResponseDto[].
 *     Those records contain userId and role but NO display name, so names
 *     are resolved via useUserDirectory (batch GET /api/users/by-ids). Falls
 *     back to a shortened userId only if a profile can't be found.
 *
 * Props:
 *   projectId     {string}             needed to scope the comments API calls
 *   isOpen        {boolean}
 *   onClose       {fn}
 *   task          {TaskResponse|null}   null = create, object = edit
 *   members       {ProjectMemberResponseDto[]}
 *   initialStatus {string}             pre-selected status for new task (column)
 *   onSave        {fn(formData)}       called with collected form values
 *   saving        {boolean}            true while onSave's request(s) are in flight
 *   error         {string|null}        error message from a failed save, shown above the footer
 */

import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle }             from 'lucide-react';
import { toDateInput, toInstant }     from '../../api/taskApi';
import useUserDirectory               from '../../hooks/useUserDirectory';
import useAuth                        from '../../hooks/useAuth';
import TaskComments                   from './TaskComments';

const STATUSES = [
  { value: 'TODO',        label: 'To Do'       },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REVIEW',      label: 'Review'      },
  { value: 'DONE',        label: 'Done'        },
];

const PRIORITIES = [
  { value: 'URGENT', label: 'Urgent' },
  { value: 'HIGH',   label: 'High'   },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW',    label: 'Low'    },
];

const PRIORITY_DOT = {
  URGENT: 'bg-[#EF4444]',
  HIGH:   'bg-[#F97316]',
  MEDIUM: 'bg-[#F59E0B]',
  LOW:    'bg-[#10B981]',
};

const FIELD_CLASS =
    'w-full bg-[#0A0918] border border-[#26224A] text-[#F5F5F5] text-sm ' +
    'px-3 py-2.5 rounded-lg placeholder-[#4A4660] outline-none ' +
    'focus:border-[#6C7BFF] transition-colors duration-150';

const LABEL_CLASS = 'block text-xs text-[#A7A3D6] mb-1.5 font-medium';

const CHEVRON = (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none"
         className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6890]">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
);

const EMPTY_FORM = {
  title:            '',
  description:      '',
  priority:         'MEDIUM',
  status:           'TODO',
  assignedToUserId: '',
  dueDate:          '',           // "YYYY-MM-DD" for the date input
};

export default function TaskModal({
                                    projectId,
                                    isOpen,
                                    onClose,
                                    task,
                                    members = [],
                                    initialStatus = 'TODO',
                                    onSave,
                                    saving = false,
                                    error = null,
                                  }) {
  const [form,   setForm]   = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const titleRef            = useRef(null);
  const isEdit              = Boolean(task);

  // For comment permissions: only the comment author can edit their own,
  // and only the author or the project's LEADER can delete — mirrors
  // TaskCommentService.java exactly.
  const { user } = useAuth();
  const currentUserId = user?.userId ?? null;
  const isLeader = members.some((m) => m.userId === currentUserId && m.role === 'LEADER');


  // Resolve each member's userId to a real display name (fullName/username),
  // falling back to a shortened userId only if the profile lookup can't
  // find that person. Same lookup used by ProjectMemberPreview.jsx.
  const { directory } = useUserDirectory(members.map((m) => m.userId));

  function memberLabel(member) {
    const profile = directory[member.userId];
    const name = profile?.fullName || profile?.username;
    return name ? `${name} (${member.role})` : `${member.userId.slice(0, 8)}… (${member.role})`;
  }

  // Reset form whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      // Edit mode — pre-fill from TaskResponse
      // dueDate is an Instant from the backend; convert to "YYYY-MM-DD" for the input
      setForm({
        title:            task.title            ?? '',
        description:      task.description      ?? '',
        priority:         task.priority         ?? 'MEDIUM',
        status:           task.status           ?? 'TODO',
        assignedToUserId: task.assignedToUserId ?? '',
        dueDate:          toDateInput(task.dueDate),
      });
    } else {
      // Create mode — blank form, pre-select the column's status
      setForm({ ...EMPTY_FORM, status: initialStatus });
    }

    setErrors({});
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [isOpen, task, initialStatus]);

  // Close on Escape (not while a save is in flight)
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape' && !saving) onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose, saving]);

  if (!isOpen) return null;

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  }

  function validate() {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      title:            form.title.trim(),
      description:      form.description.trim() || null,
      priority:         form.priority,
      status:           form.status,
      assignedToUserId: form.assignedToUserId || null,
      // Convert "YYYY-MM-DD" back to ISO Instant for the backend
      dueDate:          toInstant(form.dueDate),
    });
  }

  function handleClose() {
    if (!saving) onClose();
  }

  return (
      <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      >
        <div
            className="relative w-full max-w-lg bg-[#121029] border border-[#26224A]
                   rounded-xl shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#26224A]">
            <h2 className="text-base font-semibold text-[#F5F5F5]">
              {isEdit ? 'Edit Task' : 'Create Task'}
            </h2>
            <button
                onClick={handleClose}
                disabled={saving}
                className="text-[#6B6890] hover:text-[#F5F5F5] transition-colors disabled:opacity-50"
                aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate>
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Title */}
              <div>
                <label htmlFor="task-title" className={LABEL_CLASS}>
                  Title <span className="text-[#EF4444]">*</span>
                </label>
                <input
                    ref={titleRef}
                    id="task-title"
                    type="text"
                    value={form.title}
                    onChange={(e) => update('title', e.target.value)}
                    placeholder="What needs to be done?"
                    maxLength={255}
                    className={`${FIELD_CLASS} ${errors.title ? 'border-[#EF4444]' : ''}`}
                />
                {errors.title && (
                    <p className="flex items-center gap-1 text-[10px] text-[#EF4444] mt-1.5">
                      <AlertCircle size={10} />
                      {errors.title}
                    </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="task-desc" className={LABEL_CLASS}>Description</label>
                <textarea
                    id="task-desc"
                    rows={3}
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Add more detail…"
                    className={`${FIELD_CLASS} resize-none`}
                />
              </div>

              {/* Priority + Status (status only shown in edit mode) */}
              <div className={`grid gap-4 ${isEdit ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {/* Priority */}
                <div>
                  <label htmlFor="task-priority" className={LABEL_CLASS}>Priority</label>
                  <div className="relative">
                    <select
                        id="task-priority"
                        value={form.priority}
                        onChange={(e) => update('priority', e.target.value)}
                        className={`${FIELD_CLASS} appearance-none pr-8`}
                    >
                      {PRIORITIES.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    {/* Priority dot indicator */}
                    <div className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[form.priority] ?? ''}`} />
                    </div>
                  </div>
                </div>

                {/* Status — only in edit mode (backend ignores status on create) */}
                {isEdit && (
                    <div>
                      <label htmlFor="task-status" className={LABEL_CLASS}>Status</label>
                      <div className="relative">
                        <select
                            id="task-status"
                            value={form.status}
                            onChange={(e) => update('status', e.target.value)}
                            className={`${FIELD_CLASS} appearance-none pr-8`}
                        >
                          {STATUSES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                        {CHEVRON}
                      </div>
                    </div>
                )}
              </div>

              {/* Assignee + Due date */}
              <div className="grid grid-cols-2 gap-4">
                {/* Assignee */}
                <div>
                  <label htmlFor="task-assignee" className={LABEL_CLASS}>
                    Assignee
                  </label>
                  <div className="relative">
                    <select
                        id="task-assignee"
                        value={form.assignedToUserId}
                        onChange={(e) => update('assignedToUserId', e.target.value)}
                        className={`${FIELD_CLASS} appearance-none pr-8`}
                    >
                      <option value="">Unassigned</option>
                      {members.map((m) => (
                          <option key={m.userId} value={m.userId}>
                            {memberLabel(m)}
                          </option>
                      ))}
                    </select>
                    {CHEVRON}
                  </div>
                </div>

                {/* Due date — converted from/to ISO Instant */}
                <div>
                  <label htmlFor="task-due" className={LABEL_CLASS}>Due Date</label>
                  <input
                      id="task-due"
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => update('dueDate', e.target.value)}
                      className={`${FIELD_CLASS} [color-scheme:dark]`}
                  />
                </div>
              </div>

              {/* Comments — only in edit mode; a task must exist server-side first */}
              {isEdit && (
                  <div className="pt-1 border-t border-[#26224A]">
                    <div className="pt-4">
                      <TaskComments
                          projectId={projectId}
                          taskId={task.id}
                          currentUserId={currentUserId}
                          isLeader={isLeader}
                      />
                    </div>
                  </div>
              )}

              {/* Create-mode hint */}
              {!isEdit && (
                  <p className="text-[10px] text-[#4A4660] font-mono">
                    New tasks start in <span className="text-[#6C7BFF]">To Do</span>. Move them across
                    the board once created.
                  </p>
              )}

              {/* Save error */}
              {error && (
                  <p className="flex items-center gap-1.5 text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-lg px-3 py-2">
                    <AlertCircle size={12} className="shrink-0" />
                    {error}
                  </p>
              )}

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#26224A]">
              <button
                  type="button"
                  onClick={handleClose}
                  disabled={saving}
                  className="btn-outline text-sm px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-sm px-4 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving…' : isEdit ? 'Update Task' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </div>
  );
}