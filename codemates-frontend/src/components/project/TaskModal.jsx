/**
 * TaskModal
 *
 * Overlay modal for creating a new task or editing an existing one.
 * Resets its form state every time it opens.
 *
 * Props:
 *   isOpen        {boolean}
 *   onClose       {fn}
 *   task          {object|null}   null → create mode; object → edit mode
 *   members       {Array}         project members for the assignee dropdown
 *   initialStatus {string}        default status for new tasks (set by column's "Add task" btn)
 *   onSave        {fn(formData)}  called with the merged form data on submit
 */

import { useEffect, useRef, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

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

const EMPTY_FORM = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'TODO',
  assignedToUserId: '',
  dueDate: '',
};

export default function TaskModal({
  isOpen,
  onClose,
  task,
  members = [],
  initialStatus = 'TODO',
  onSave,
}) {
  const [form, setForm]       = useState(EMPTY_FORM);
  const [errors, setErrors]   = useState({});
  const titleRef              = useRef(null);

  // Reset form whenever the modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (task) {
      // Edit mode — pre-fill from task
      setForm({
        title:             task.title            || '',
        description:       task.description      || '',
        priority:          task.priority         || 'MEDIUM',
        status:            task.status           || 'TODO',
        assignedToUserId:  task.assignedToUserId || '',
        dueDate:           task.dueDate          || '',
      });
    } else {
      // Create mode — blank form with the column's status pre-selected
      setForm({ ...EMPTY_FORM, status: initialStatus });
    }

    setErrors({});

    // Auto-focus the title field after the modal renders
    setTimeout(() => titleRef.current?.focus(), 50);
  }, [isOpen, task, initialStatus]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

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
      ...form,
      title:            form.title.trim(),
      description:      form.description.trim(),
      assignedToUserId: form.assignedToUserId || null,
      dueDate:          form.dueDate || null,
    });
  }

  const isEdit = Boolean(task);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.65)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card */}
      <div
        className="relative w-full max-w-lg bg-[#121029] border border-[#26224A]
                   rounded-xl shadow-2xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#26224A]">
          <h2 className="text-base font-semibold text-[#F5F5F5]">
            {isEdit ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            onClick={onClose}
            className="text-[#6B6890] hover:text-[#F5F5F5] transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Form ───────────────────────────────────────────────────────── */}
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

            {/* Priority + Status */}
            <div className="grid grid-cols-2 gap-4">
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
                  {/* Priority dot inside select */}
                  <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${PRIORITY_DOT[form.priority]}`} />
                  </div>
                </div>
              </div>

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
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6890]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignee + Due date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-assignee" className={LABEL_CLASS}>Assignee</label>
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
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#6B6890]">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>

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

          </div>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#26224A]">
            <button
              type="button"
              onClick={onClose}
              className="btn-outline text-sm px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary text-sm px-4 py-2"
            >
              {isEdit ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}