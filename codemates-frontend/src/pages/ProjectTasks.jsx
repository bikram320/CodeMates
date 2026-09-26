/**
 * src/pages/ProjectTasks.jsx
 *
 * Kanban task board — wired to the real Spring Boot API.
 *
 * Data flow:
 *   ProjectTasks.jsx
 *     → useTasks(projectId)          GET /api/projects/{projectId}/tasks
 *     → useProjectMembers(projectId) GET /api/projects/{projectId}/members
 *
 * Two separate mutations match the two backend endpoints:
 *
 *   updateTask({ taskId, data })
 *     → PUT /api/projects/{projectId}/tasks/{taskId}   (fields only)
 *
 *   changeStatus({ taskId, status, position? })
 *     → PUT /api/projects/{projectId}/tasks/{taskId}/status
 *
 * handleSave calls them based on what changed in the form:
 *   - If any field (title/desc/priority/assignee/dueDate) changed → updateTask
 *   - If status changed → changeStatus
 *   - If both changed, they're now run IN SEQUENCE (updateTask, then
 *     changeStatus), not fired in parallel. Firing both at once let their
 *     responses race: since UpdateTaskRequest's response is a full
 *     TaskResponse (it includes `status` even though that endpoint doesn't
 *     touch it), if that response happened to land back *after* the status
 *     endpoint's response, it would silently overwrite the freshly-changed
 *     status with whatever status the server had at the time it processed
 *     the fields-only request — i.e. the task would flip back to its old
 *     status right after you changed it. useTasks.js also now does a narrow
 *     merge per endpoint as a second line of defense, but sequencing here
 *     avoids the race outright.
 *
 * dueDate:
 *   Backend sends Instant (ISO string). TaskCard displays it formatted.
 *   TaskModal converts between "YYYY-MM-DD" (input) and ISO (API) via
 *   toDateInput() / toInstant() from taskApi.js.
 *
 * Members:
 *   ProjectMemberResponseDto has { userId, role } but no display name.
 *   TaskCard shows a generic avatar + shortened userId until user-service
 *   is integrated. The assignee dropdown in TaskModal works the same way.
 */

import { useMemo, useState }              from 'react';
import { useParams }                      from 'react-router-dom';
import { Plus, AlertCircle, RefreshCw ,LayoutDashboard} from 'lucide-react';

import { useTasks }                       from '../hooks/useTasks';
import { useProjectMembers }              from '../hooks/useMyProjects';
import KanbanColumn                       from '../components/task/KanbanColumn';
import TaskFilters                        from '../components/task/TaskFilters';
import TaskModal                          from '../components/task/TaskModal';

// ── Column definitions ────────────────────────────────────────────────────────

const COLUMNS = [
  { status: 'TODO',        title: 'To Do',      color: '#6B6890' },
  { status: 'IN_PROGRESS', title: 'In Progress', color: '#6C7BFF' },
  { status: 'REVIEW',      title: 'Review',      color: '#F59E0B' },
  { status: 'DONE',        title: 'Done',        color: '#10B981' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Fields that UpdateTaskRequest accepts (no status). */
const UPDATE_FIELDS = ['title', 'description', 'priority', 'assignedToUserId', 'dueDate'];

/**
 * Compares a field for "did this actually change". dueDate needs special
 * handling: the form sends it through toInstant(), which normalizes
 * "YYYY-MM-DD" to a full ISO string with milliseconds
 * ("2026-09-20T00:00:00.000Z"), which will never string-match the
 * original task's dueDate from the server ("2026-09-20T00:00:00Z") even
 * when the date is identical — comparing them as Date values instead of
 * raw strings avoids false positives that used to make updateTask fire
 * on every save, even ones that only touched status.
 */
function valuesEqual(key, a, b) {
  if (key === 'dueDate') {
    const da = a ? new Date(a).getTime() : null;
    const db = b ? new Date(b).getTime() : null;
    return da === db;
  }
  return a === b;
}

function hasFieldChanges(formData, original) {
  return UPDATE_FIELDS.some((key) => {
    if (formData[key] === undefined) return false;
    return !valuesEqual(key, formData[key], original?.[key] ?? null);
  });
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function Pulse({ className }) {
  return <div className={`bg-[#1D1A40] rounded animate-pulse ${className}`} />;
}

function KanbanSkeleton() {
  return (
      <div className="flex flex-col h-full space-y-5" aria-busy="true">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Pulse className="w-8 h-8 rounded-lg" />
            <div className="space-y-1.5">
              <Pulse className="h-5 w-28" />
              <Pulse className="h-3 w-40" />
            </div>
          </div>
          <Pulse className="h-9 w-32 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <Pulse className="h-10 flex-1 max-w-xs rounded-lg" />
          <Pulse className="h-10 w-36 rounded-lg" />
          <Pulse className="h-10 w-36 rounded-lg" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2, 3].map((i) => (
              <div
                  key={i}
                  className="min-w-[272px] w-[272px] bg-[#0A0918] border border-[#1C1A38] rounded-xl p-3 space-y-3 shrink-0"
              >
                <Pulse className="h-8 w-full rounded-lg" />
                {Array.from({ length: Math.max(1, 3 - i) }).map((_, j) => (
                    <div key={j} className="border border-[#26224A] rounded-xl p-3.5 space-y-2.5">
                      <Pulse className="h-4 w-4/5" />
                      <Pulse className="h-3 w-full" />
                      <Pulse className="h-3 w-3/5" />
                      <div className="flex justify-between pt-1">
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
        <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
            style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
        >
          <AlertCircle size={24} style={{ color: '#EF4444' }} />
        </div>
        <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">
          Failed to load tasks
        </h2>
        <p className="text-sm text-[#8B86B8] mb-6 max-w-sm">
          {message || 'Check that the Spring Boot backend is running.'}
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

  // ── Data ──────────────────────────────────────────────────────────────────
  const {
    tasks,
    isLoading, isError, error, refetch,
    createTask, updateTaskAsync, changeStatusAsync,
    isCreating,
  } = useTasks(projectId);

  const { members } = useProjectMembers(projectId);

  // ── Filter state ──────────────────────────────────────────────────────────
  const [search,         setSearch]         = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');

  // ── Modal state ───────────────────────────────────────────────────────────
  const [modalOpen,     setModalOpen]     = useState(false);
  const [editingTask,   setEditingTask]   = useState(null);
  const [initialStatus, setInitialStatus] = useState('TODO');
  const [savingEdit,    setSavingEdit]    = useState(false);
  const [saveError,     setSaveError]     = useState(null);

  // ── Filtered + bucketed tasks ─────────────────────────────────────────────
  const filteredTasks = useMemo(() => {
    const q = search.toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q) &&
          !(t.description ?? '').toLowerCase().includes(q)) return false;
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
    setSaveError(null);
  }

  async function handleSave(formData) {
    if (editingTask) {
      // ── Edit: route to the correct endpoint(s), one at a time ────────────
      //
      // UpdateTaskRequest (PUT /tasks/{id}): title, description, priority,
      //   assignedToUserId, dueDate — NOT status
      //
      // ChangeTaskStatusRequest (PUT /tasks/{id}/status): status, position?
      //
      // Run sequentially (await each) rather than firing both at once —
      // see the file header comment for why firing them in parallel could
      // make a status change silently revert.
      const { status, ...fields } = formData;

      setSavingEdit(true);
      setSaveError(null);
      try {
        if (hasFieldChanges(fields, editingTask)) {
          await updateTaskAsync({ taskId: editingTask.id, data: fields });
        }
        if (status && status !== editingTask.status) {
          await changeStatusAsync({ taskId: editingTask.id, status });
        }
        closeModal();
      } catch (err) {
        // Leave the modal open so the person can see what failed and retry,
        // instead of silently closing on a failed save.
        setSaveError(err?.message || 'Failed to save changes.');
      } finally {
        setSavingEdit(false);
      }
    } else {
      // ── Create: omit status (backend always creates as TODO) ─────────────
      const { status: _ignored, ...createData } = formData;
      createTask(createData);
      closeModal();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (isLoading) return <KanbanSkeleton />;
  if (isError)   return <TasksError message={error?.message} onRetry={refetch} />;

  return (
      <div className="flex flex-col h-full min-h-0 space-y-5">

        {/* Page header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1D1A40] flex items-center justify-center">
              <LayoutDashboard size={16} style={{ color: '#6C7BFF' }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#F5F5F5] tracking-tight">
                Task Board
              </h1>
              <p className="text-xs text-[#6B6890] font-mono">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
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

        {/* Filters */}
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

        {/* Kanban board */}
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

        {/* Modal */}
        <TaskModal
            projectId={projectId}
            isOpen={modalOpen}
            onClose={closeModal}
            task={editingTask}
            members={members}
            initialStatus={initialStatus}
            onSave={handleSave}
            saving={savingEdit}
            error={saveError}
        />
      </div>
  );
}