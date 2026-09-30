/**
 * KanbanColumn
 *
 * One of the four Kanban columns rendered on ProjectTasks.
 * Handles its own scrollable task list and empty state.
 *
 * Props:
 *   title     {string}    Display name, e.g. "In Progress"
 *   status    {string}    API enum value: TODO | IN_PROGRESS | REVIEW | DONE
 *   tasks     {Array}     Filtered tasks for this column
 *   members   {Array}     Project members (passed to TaskCard)
 *   color     {string}    Hex accent colour for the column header dot
 *   onTaskClick {fn}      Called with the task when a card is clicked
 *   onAddTask   {fn}      Called when "Add task" is clicked
 */

import { Plus } from 'lucide-react';
import TaskCard from './TaskCard';

function EmptyColumn({ status }) {
  const messages = {
    TODO:        'No tasks queued.',
    IN_PROGRESS: 'Nothing in progress.',
    REVIEW:      'No tasks awaiting review.',
    DONE:        'No completed tasks yet.',
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="w-8 h-8 rounded-lg bg-[#1D1A40] flex items-center justify-center mb-3">
        <div className="w-3 h-3 rounded-sm border-2 border-[#2E2A66]" />
      </div>
      <p className="text-[1.125rem] text-[#4A4660]">{messages[status] ?? 'No tasks.'}</p>
    </div>
  );
}

export default function KanbanColumn({
  title,
  status,
  tasks,
  members,
  color,
  onTaskClick,
  onAddTask,
}) {
  return (
    <div className="flex flex-1 flex-col min-w-[272px] bg-[#0A0918] border border-[#1C1A38] rounded-xl overflow-hidden">

      {/* ── Column header ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-[#1C1A38] flex items-center gap-2.5">
        {/* Accent dot */}
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />

        {/* Column title */}
        <span className="text-xs font-semibold text-[#F5F5F5] uppercase tracking-wider flex-1">
          {title}
        </span>

      </div>

      {/* ── Task list ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5"
           style={{ minHeight: '360px', maxHeight: 'calc(100vh - 260px)' }}>
        {tasks.length === 0 ? (
          <EmptyColumn status={status} />
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              members={members}
              onClick={() => onTaskClick(task)}
            />
          ))
        )}
      </div>

      {/* ── Add task button ────────────────────────────────────────────────── */}
      <div className="p-3 border-t border-[#1C1A38]">
        <button
          onClick={onAddTask}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs
                     text-[#6B6890] hover:text-[#C9A8FF] hover:bg-[#1D1A40]
                     transition-colors duration-150"
        >
          <Plus size={13} />
          Add task
        </button>
      </div>
    </div>
  );
}