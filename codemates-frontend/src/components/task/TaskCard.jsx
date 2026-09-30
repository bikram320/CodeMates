/**
 * TaskCard
 *
 * A single card rendered inside a KanbanColumn.
 * Clicking the card opens the edit modal (handled by the parent).
 *
 * Visual anatomy:
 *   ┌─┬──────────────────────────────┐
 *   │ │  Title                       │
 *   │ │  Description (2-line clamp)  │
 *   │ │                              │
 *   │ │  [Assignee]  [Priority] [Due]│
 *   └─┴──────────────────────────────┘
 *   ↑ coloured priority strip
 *
 * Props:
 *   task    {object}  TaskResponse shape
 *   members {Array}   project members for assignee lookup
 *   onClick {function}
 */

import { Calendar, User } from 'lucide-react';


// Priority → left-strip colour
const PRIORITY_COLOR = {
  URGENT: '#870606',
  HIGH:   '#f96800',
  MEDIUM: '#f1f100',
  LOW:    '#036e3a',
};

// Priority → badge text + style classes
const PRIORITY_BADGE = {
  URGENT: { label: 'Urgent', className: 'text-[#EF4444] bg-[#EF4444]/10 border-[#EF4444]/30' },
  HIGH:   { label: 'High',   className: 'text-[#F97316] bg-[#F97316]/10 border-[#F97316]/30' },
  MEDIUM: { label: 'Med',    className: 'text-[#F59E0B] bg-[#F59E0B]/10 border-[#F59E0B]/30' },
  LOW:    { label: 'Low',    className: 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/30' },
};

function formatDate(dateStr) {
  if (!dateStr) return null;
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function AssigneeChip({ member }) {
  if (!member) {
    return (
      <div className="flex items-center gap-1 text-[#4A4660]">
        <User size={12} />
        <span className="text-[10px]">Unassigned</span>
      </div>
    );
  }

  if (member.avatarUrl) {
    return (
<<<<<<< Updated upstream
      <img
        src={member.avatarUrl}
        alt={member.fullName}
        title={member.fullName}
        className="w-5 h-5 rounded-full border border-[#2E2A66] object-cover"
      />
=======
        <div
            title={displayName}
            className="w-[26px] h-[26px] rounded-full bg-[#1D1A40] border border-[#2E2A66] flex items-center justify-center text-[14px] font-bold text-[#6C7BFF] select-none"
        >
            {initials}
        </div>
>>>>>>> Stashed changes
    );
  }

  return (
    <div
      title={member.fullName}
      className="w-5 h-5 rounded-full bg-[#1D1A40] border border-[#2E2A66] flex items-center justify-center text-[9px] font-bold text-[#6C7BFF] select-none"
    >
      {member.initials}
    </div>
  );
}

export default function TaskCard({ task, members, onClick }) {
  const assignee = task.assignedToUserId
    ? getMemberById(members, task.assignedToUserId)
    : null;

  const priorityColor  = PRIORITY_COLOR[task.priority]  ?? '#6B6890';
  const priorityBadge  = PRIORITY_BADGE[task.priority]  ?? { label: task.priority, className: 'text-[#6B6890] border-[#26224A]' };
  const overdue        = isOverdue(task.dueDate) && task.status !== 'DONE';
  const formattedDate  = formatDate(task.dueDate);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className="flex rounded-xl overflow-hidden border border-[#26224A] bg-[#121029]
                 hover:border-[#6C7BFF] transition-colors duration-150 cursor-pointer group"
    >
      {/* Priority strip */}
      <div className="w-1 shrink-0" style={{ backgroundColor: priorityColor }} />

      {/* Content */}
      <div className="flex-1 p-3.5 min-w-0">
        {/* Title */}
        <p className="text-sm font-medium text-[#F5F5F5] leading-snug mb-1.5 group-hover:text-white">
          {task.title}
        </p>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-[#8B86B8] leading-relaxed mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 mt-auto">
          {/* Left: assignee */}
          <AssigneeChip member={assignee} />

          {/* Right: priority badge + due date */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Priority */}
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${priorityBadge.className}`}
            >
              {priorityBadge.label}
            </span>

            {/* Due date */}
            {formattedDate && (
              <div
                className={`flex items-center gap-1 text-[10px] ${
                  overdue ? 'text-[#EF4444]' : 'text-[#6B6890]'
                }`}
              >
                <Calendar size={10} />
                {overdue ? 'Overdue' : formattedDate}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}