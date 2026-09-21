/**
 * src/pages/ProjectTasks.jsx
 *
 * Kanban task board for a single project.
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *
 *   ProjectTasks.jsx
 *     → useTasks(projectId)          hooks/useTasks.js
 *       → taskApi.getTasks()         api/taskApi.js
 *         → getMockTasks()           mock/taskMock.js   ← now
 *         → GET /api/projects/{id}/tasks               ← when VITE_USE_MOCK=false
 *
 * ── What changed from the previous version ───────────────────────────────────
 *   REMOVED: useState(() => getMockTasks())  — local task state
 *   ADDED:   useTasks(projectId)             — React Query hook
 *   CHANGED: handleSave calls createTask / updateTask mutations instead of setTasks
 *   ADDED:   KanbanSkeleton + TasksError states
 *   KEPT:    All filter logic, modal logic, and board UI — unchanged
 *
 * ── Switching to real backend ─────────────────────────────────────────────────
 *   Set VITE_USE_MOCK=false in .env
 *   Nothing in this file changes.
 */

import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, SquareKanban, AlertCircle, RefreshCw } from 'lucide-react';

import { useTasks }                       from '../hooks/useTasks';
import { getMockMembers }                 from '../mock/taskMock';
import KanbanColumn                       from '../components/task/KanbanColumn';
import TaskFilters                        from '../components/task/Taskfilters';
import TaskModal                          from '../components/task/TaskModal';

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS = [
  { status: 'TODO',        title: 'To Do',       color: '#6B6890' },
  { status: 'IN_PROGRESS', title: 'In Progress',  color: '#6C7BFF' },
  { status: 'REVIEW',      title: 'Review',       color: '#F59E0B' },
  { status: 'DONE',        title: 'Done',         color: '#10B981' },
];

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Pulse({ className }) {
  return <div className={`bg-[#1D1A40] rounded animate-pulse ${className}`} />;
}

function KanbanSkeleton() {
  return (
    <div className="flex flex-col h-full space-y-5" aria-busy="true" aria-label="Loading tasks…">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Pulse className="w-8 h-8 rounded-lg" />
          <div className="space-y-1.5">
            <Pulse className="h-5 w-28" />
            <Pulse className="h-3 w-36" />
          </div>
        </div>
        <Pulse className="h-9 w-32 rounded-lg" />
      </div>
      {/* Filters */}
      <div className="flex gap-3">
        <Pulse className="h-10 flex-1 max-w-xs rounded-lg" />
        <Pulse className="h-10 w-36 rounded-lg" />
        <Pulse className="h-10 w-36 rounded-lg" />
      </div>
      {/* Columns */}
      <div className="flex gap-4 overflow-hidden">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="min-w-[272px] w-[272px] bg-[#0A0918] border border-[#1C1A38] rounded-xl p-3 space-y-3 shrink-0"
          >
            <Pulse className="h-8 w-full rounded-lg" />
            {[0, 1, 2].slice(0, 3 - i).map((j) => (
              <div key={j} className="border border-[#26224A] rounded-xl p-3.5 space-y-2.5">
                <Pulse className="h-4 w-4/5" />
                <Pulse className="h-3 w-full" />
                <Pulse className="h-3 w-3/5" />
                <div className="flex items-center justify-between pt-1">
                  <Pulse className="w-5 h-5 rounded-full" />
                  <Pulse className="h-4 w-16 rounded" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────────

function TasksError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center mb-4">
        <AlertCircle size={24} style={{ color: '#EF4444' }} />
      </div>
      <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">Failed to load tasks</h2>
      <p className="text-sm text-[#8B86B8] mb-6 max-w-sm">
        {message || 'Something went wrong while fetching the task board.'}
      </p>
      <button onClick={onRetry} className="btn-primary">
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectTasks() {
  const { projectId } = useParams();

  // Fallback ID lets the page render with mock data even without a route param
  const resolvedProjectId = projectId ?? 'proj-uuid-001';

  // ── Data layer — replaces the previous useState(() => getMockTasks()) ──────
  const {
    tasks,
    isLoading,
    isError,
    error,
    refetch,
    createTask,
    updateTask,
    isCreating,
  } = useTasks(resolvedProjectId);

  // Members are not yet behind a hook — kept as local mock state
  const [members] = useState(() => getMockMembers());

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search,         setSearch]         = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingTask,   setEditingTask]   = useState(null);
  const [initialStatus, setInitialStatus] = useState('TODO');

  // ── Derived: filtered + bucketed tasks ───────────────────────────────────
  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) && !t.description?.toLowerCase().includes(q)) {
        return false;
      }
      if (priorityFilter && t.priority !== priorityFilter) return false;
      if (assigneeFilter) {
        if (assigneeFilter === '__unassigned__' && t.assignedToUserId) return false;
        if (assigneeFilter !== '__unassigned__' && t.assignedToUserId !== assigneeFilter) return false;
      }
      return true;
    });
  }, [tasks, search, priorityFilter, assigneeFilter]);

  const tasksByStatus = useMemo(() => {
    const buckets = {};
    COLUMNS.forEach((col) => { buckets[col.status] = []; });
    filteredTasks.forEach((t) => {
      if (buckets[t.status]) buckets[t.status].push(t);
    });
    return buckets;
  }, [filteredTasks]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  function openCreateModal(status = 'TODO') {
    setEditingTask(null);
    setInitialStatus(status);
    setModalOpen(true);
  }

  function openEditModal(task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingTask(null);
  }

  function handleSave(formData) {
    if (editingTask) {
      // updateTask accepts all fields including status — taskApi handles the routing
      updateTask({ taskId: editingTask.id, data: formData });
    } else {
      // createTask: status from formData is ignored by the API (always TODO)
      createTask(formData);
    }
    // Close immediately — optimistic updates make the board reflect the change instantly
    closeModal();
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return <KanbanSkeleton />;
  if (isError)   return <TasksError message={error?.message} onRetry={refetch} />;

  return (
    <div className="flex flex-col h-full min-h-0 space-y-5">

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1D1A40] flex items-center justify-center">
            <SquareKanban size={16} style={{ color: '#6C7BFF' }} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#F5F5F5] tracking-tight">
              Task Board
            </h1>
            <p className="text-xs text-[#6B6890] font-mono">
              orbit-cli · {tasks.length} task{tasks.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <button
          onClick={() => openCreateModal('TODO')}
          disabled={isCreating}
          className="btn-primary text-sm shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus size={15} />
          {isCreating ? 'Creating…' : 'Create Task'}
        </button>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <TaskFilters
        search={search}
        onSearchChange={setSearch}
        priorityFilter={priorityFilter}
        onPriorityChange={setPriorityFilter}
        assigneeFilter={assigneeFilter}
        onAssigneeChange={setAssigneeFilter}
        members={members}
        totalCount={tasks.length}
        filteredCount={filteredTasks.length}
      />

      {/* ── Kanban board ────────────────────────────────────────────────── */}
      <div className="flex gap-4 overflow-x-auto pb-2 flex-1 min-h-0">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.status}
            title={col.title}
            status={col.status}
            color={col.color}
            tasks={tasksByStatus[col.status] ?? []}
            members={members}
            onTaskClick={openEditModal}
            onAddTask={() => openCreateModal(col.status)}
          />
        ))}
      </div>

      {/* ── Create / Edit modal ──────────────────────────────────────────── */}
      <TaskModal
        isOpen={modalOpen}
        onClose={closeModal}
        task={editingTask}
        members={members}
        initialStatus={initialStatus}
        onSave={handleSave}
      />
    </div>
  );
}