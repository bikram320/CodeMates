/**
 * src/pages/MyProjects.jsx
 *
 * The "My Projects" page — shows all projects the user owns or has joined.
 *
 * ── Data flow ──────────────────────────────────────────────────────────────────
 *
 *   MyProjects.jsx
 *     → useMyProjects()              hooks/useMyProjects.js
 *       → projectsApi.getMyProjects() api/projectsApi.js
 *         → getMockProjects()         mock/projectsMock.js   ← now
 *         → GET /api/projects/my                             ← VITE_USE_MOCK=false
 *
 * ── What changed from the previous version ─────────────────────────────────────
 *
 *   REMOVED:
 *     import { MOCK_MY_PROJECTS } from '../mock/projectMock'
 *     const [allProjects, setAllProjects] = useState([])
 *     const [isLoading, setIsLoading]     = useState(true)
 *     useEffect(() => { setTimeout(...) }, [])
 *
 *   ADDED:
 *     import { useMyProjects } from '../hooks/useMyProjects'
 *     const { projects, isLoading, isError, error, refetch } = useMyProjects()
 *     <ProjectsError /> error state with retry
 *
 *   UNCHANGED:
 *     Tab bar, ProjectFilters, MyProjectsList, MyProjectsHeader
 *     All filter/sort logic (useMemo pipeline)
 *     Navigation (useNavigate)
 *     Every rendered element
 *
 * ── Switching to the real backend ─────────────────────────────────────────────
 *   Set VITE_USE_MOCK=false in .env — nothing in this file changes.
 */

import { useMemo, useState }    from 'react';
import { useNavigate }          from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';

import { useMyProjects }   from '../hooks/useMyProjects';
import MyProjectsHeader    from '../components/projectList/MyProjectsHeader';
import ProjectFilters      from '../components/projectList/ProjectFilters';
import MyProjectsList      from '../components/projectList/MyProjectsList';

// ── Sort helper ───────────────────────────────────────────────────────────────

function applySort(projects, sortBy) {
  return [...projects].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'progress': {
        const pctA = a.taskCount > 0 ? a.tasksCompleted / a.taskCount : 0;
        const pctB = b.taskCount > 0 ? b.tasksCompleted / b.taskCount : 0;
        return pctB - pctA;
      }
      case 'members':
        return b.memberCount - a.memberCount;
      default:
        return 0; // 'lastActivity' — mock data is already newest-first
    }
  });
}

// ── Tab config ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'all',    label: (a, _o, _m) => `All (${a})`       },
  { key: 'owned',  label: (_a, o, _m) => `Owned (${o})`     },
  { key: 'member', label: (_a, _o, m) => `Member Of (${m})` },
];

// ── Error state ───────────────────────────────────────────────────────────────

function ProjectsError({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
           style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}>
        <AlertCircle size={24} style={{ color: '#EF4444' }} />
      </div>
      <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">
        Failed to load projects
      </h2>
      <p className="text-sm text-[#8B86B8] mb-6 max-w-sm">
        {message || 'Something went wrong while fetching your projects.'}
      </p>
      <button onClick={onRetry} className="btn-primary">
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyProjects() {
  const navigate = useNavigate();

  // ── Data — replaces the previous useState + useEffect mock ────────────────
  const { projects: allProjects, isLoading, isError, error, refetch } = useMyProjects();

  // ── Filter / sort state ───────────────────────────────────────────────────
  const [activeTab,     setActiveTab]     = useState('all');
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState('');
  const [typeFilter,    setTypeFilter]    = useState('');
  const [roleFilter,    setRoleFilter]    = useState('');
  const [sortBy,        setSortBy]        = useState('lastActivity');

  // ── Derived counts for tab labels ─────────────────────────────────────────
  const ownedCount  = useMemo(() => allProjects.filter((p) => p.isOwner).length,  [allProjects]);
  const memberCount = useMemo(() => allProjects.filter((p) => !p.isOwner).length, [allProjects]);

  // ── Filter + sort pipeline ────────────────────────────────────────────────
  const filteredProjects = useMemo(() => {
    let result = allProjects;

    // Tab
    if (activeTab === 'owned')  result = result.filter((p) => p.isOwner);
    if (activeTab === 'member') result = result.filter((p) => !p.isOwner);

    // Search: name, description, or tech stack
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.techStack.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Dropdown filters
    if (statusFilter) result = result.filter((p) => p.status === statusFilter);
    if (typeFilter)   result = result.filter((p) => p.type   === typeFilter);
    if (roleFilter)   result = result.filter((p) => p.role   === roleFilter);

    return applySort(result, sortBy);
  }, [allProjects, activeTab, search, statusFilter, typeFilter, roleFilter, sortBy]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const hasFilters = Boolean(search || statusFilter || typeFilter || roleFilter);

  function clearFilters() {
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setRoleFilter('');
  }

  // ── Error state ───────────────────────────────────────────────────────────
  // Rendered before the main layout so the page header is not orphaned.
  if (isError) {
    return <ProjectsError message={error?.message} onRetry={refetch} />;
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <MyProjectsHeader
        totalCount={allProjects.length}
        ownedCount={ownedCount}
        onCreate={() => navigate('/projects/create')}
      />

      {/* ── Tab bar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-[#26224A] flex gap-0 -mb-2">
        {TABS.map((tab) => {
          const label    = tab.label(allProjects.length, ownedCount, memberCount);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-4 py-2.5 text-sm font-medium transition-colors pb-3 ${
                isActive
                  ? 'text-[#6C7BFF]'
                  : 'text-[#6B6890] hover:text-[#A7A3D6]'
              }`}
            >
              {label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6C7BFF] rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Filters — hide while loading or when there are no projects ───── */}
      {!isLoading && allProjects.length > 0 && (
        <ProjectFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeChange={setTypeFilter}
          roleFilter={roleFilter}
          onRoleChange={setRoleFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}

      {/* ── Result count — only when a filter is active ──────────────────── */}
      {!isLoading && hasFilters && (
        <p className="text-xs text-[#6B6890]">
          {filteredProjects.length} of {allProjects.length} project
          {allProjects.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* ── List ────────────────────────────────────────────────────────── */}
      <MyProjectsList
        projects={filteredProjects}
        isLoading={isLoading}
        onViewProject={(id) => navigate(`/projects/${id}`)}
        hasFilters={hasFilters}
        onClearFilters={clearFilters}
        onCreateProject={() => navigate('/projects/create')}
      />

    </div>
  );
}