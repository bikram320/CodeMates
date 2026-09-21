/**
 * UpcomingTasks
 *
 * Compact list of the user's upcoming tasks, sorted by due date.
 * Colour-coded by priority (HIGH | URGENT = red, MEDIUM = amber, LOW = green).
 * Overdue tasks are flagged in red.
 *
 * Props:
 *   tasks {Array} - from data.upcomingTasks (TaskResponse shape + projectName)
 *     .id          {string}
 *     .title       {string}
 *     .projectName {string}   (denormalized for display)
 *     .projectId   {string}
 *     .priority    {string}   HIGH | MEDIUM | LOW | URGENT  (API enum, uppercase)
 *     .dueDate     {string}   ISO date  e.g. "2026-09-20"
 *     .status      {string}   TODO | IN_PROGRESS | REVIEW | DONE
 */

import { CheckSquare } from 'lucide-react';

// Uppercase API enum values → display config
const PRIORITY_CONFIG = {
  HIGH: {
    label: 'High',
    dot: 'bg-[#EF4444]',
    text: 'text-[#EF4444]',
    border: 'border-[#EF4444]/30',
  },
  URGENT: {
    label: 'Urgent',
    dot: 'bg-[#EF4444]',
    text: 'text-[#EF4444]',
    border: 'border-[#EF4444]/30',
  },
  MEDIUM: {
    label: 'Med',
    dot: 'bg-[#F59E0B]',
    text: 'text-[#F59E0B]',
    border: 'border-[#F59E0B]/30',
  },
  LOW: {
    label: 'Low',
    dot: 'bg-[#10B981]',
    text: 'text-[#10B981]',
    border: 'border-[#10B981]/30',
  },
};

const DEFAULT_PRIORITY = PRIORITY_CONFIG.MEDIUM;

function formatDueDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

function TaskItem({ task }) {
  // API sends uppercase (HIGH/MEDIUM/LOW/URGENT); mock also sends uppercase
  const priority = PRIORITY_CONFIG[task.priority?.toUpperCase()] ?? DEFAULT_PRIORITY;
  const overdue = isOverdue(task.dueDate);

  return (
    <div className="flex items-start gap-3 py-3 border-b border-[#26224A] last:border-0">
      {/* Priority dot */}
      <div className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${priority.dot}`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#F5F5F5] truncate leading-snug">{task.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] font-mono text-[#C9A8FF] truncate max-w-[100px]">
            {task.projectName}
          </span>
          <span className="text-[#2E2A66]">·</span>
          <span
            className={`text-[10px] ${
              overdue ? 'text-[#EF4444]' : 'text-[#6B6890]'
            }`}
          >
            {overdue ? 'Overdue' : formatDueDate(task.dueDate)}
          </span>
        </div>
      </div>

      {/* Priority badge */}
      <span
        className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${priority.text} ${priority.border}`}
      >
        {priority.label}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-8 text-center">
      <div className="w-10 h-10 rounded-lg bg-[#1D1A40] flex items-center justify-center mx-auto mb-3">
        <CheckSquare size={18} className="text-[#2E2A66]" />
      </div>
      <p className="text-xs text-[#6B6890]">You're all caught up!</p>
      <p className="text-[10px] text-[#4A4660] mt-1">No tasks due soon.</p>
    </div>
  );
}

export default function UpcomingTasks({ tasks }) {
  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#F5F5F5]">Upcoming Tasks</h2>
        {tasks?.length > 0 && (
          <a
            href="/tasks"
            className="text-xs text-[#6C7BFF] hover:text-[#C9A8FF] transition-colors"
          >
            View all →
          </a>
        )}
      </div>

      {!tasks?.length ? (
        <EmptyState />
      ) : (
        <div className="card px-4 py-1">
          {tasks.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))}
        </div>
      )}
    </section>
  );
}