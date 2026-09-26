/**
 * src/pages/MyProjects.jsx
 *
 * My Projects page — wired to the real Spring Boot API.
 *
 * Data flow:
 *   MyProjects.jsx → useMyProjects() → projectApi.getMyProjects()
 *                                    → GET /api/projects/my
 *
 * Filters are all client-side — the API returns the full list and we
 * filter in useMemo. No filter params are sent to the backend.
 *
 * Fields available in real ProjectResponse (from Spring Boot):
 *   id, ownerUserId, name, description, githubRepoUrl,
 *   status (ACTIVE|COMPLETED|ARCHIVED), visibility (PUBLIC|PRIVATE),
 *   techStack (String), maxMembers, memberCount, createdAt
 *
 * Fields removed vs. earlier mock version (not in the real API):
 *   type, role, taskCount, tasksCompleted, lastActivity
 *
 * Auth context:
 *   currentUserId is used to show the owner crown on MyProjectCard.
 *   Replace the placeholder below with your Zustand auth store once
 *   auth is connected:
 *     import { useAuthStore } from '../store/authStore';
 *     const currentUserId = useAuthStore(s => s.user?.id ?? null);
 */

import { useMemo, useState }        from 'react';
import { useNavigate }              from 'react-router-dom';
import { AlertCircle, RefreshCw }   from 'lucide-react';

import { useMyProjects }            from '../hooks/useMyProjects';
import MyProjectsHeader             from '../components/project/MyProjectsHeader';
import ProjectFilters               from '../components/project/ProjectFilters';
import MyProjectsList               from '../components/project/MyProjectsList';
import PendingInvitationsWidget     from '../components/project/PendingInvitationsWidget';

// ── Auth placeholder ──────────────────────────────────────────────────────────
// Replace with: import { useAuthStore } from '../store/authStore';
//               const currentUserId = useAuthStore(s => s.user?.id ?? null);
const currentUserId = null; // ← plug in auth store here

// ── Sort helper ───────────────────────────────────────────────────────────────

function applySort(projects, sortBy) {
    return [...projects].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'memberCount':
                return (b.memberCount ?? 0) - (a.memberCount ?? 0);
            default: // 'createdAt' — newest first
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });
}

// ── Error state ───────────────────────────────────────────────────────────────

function ProjectsError({ message, onRetry }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center mb-5"
                style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
            >
                <AlertCircle size={24} style={{ color: '#EF4444' }} />
            </div>
            <h2 className="text-base font-semibold text-[#F5F5F5] mb-2">
                Failed to load projects
            </h2>
            <p className="text-sm text-[#8B86B8] mb-6 max-w-sm">
                {message || 'Something went wrong. Check that the backend is running.'}
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

    // ── Data ──────────────────────────────────────────────────────────────────
    const { projects: allProjects, isLoading, isError, error, refetch } =
        useMyProjects();

    // ── Filter / sort state ───────────────────────────────────────────────────
    const [search,           setSearch]           = useState('');
    const [statusFilter,     setStatusFilter]     = useState('');
    const [visibilityFilter, setVisibilityFilter] = useState('');
    const [sortBy,           setSortBy]           = useState('createdAt');

    // ── Derived counts ────────────────────────────────────────────────────────
    // Ownership derived from ownerUserId — only accurate when currentUserId is set
    const ownedCount = useMemo(
        () =>
            currentUserId
                ? allProjects.filter((p) => p.ownerUserId === currentUserId).length
                : 0,
        [allProjects]
    );

    // ── Filter + sort pipeline ────────────────────────────────────────────────
    const filteredProjects = useMemo(() => {
        let result = allProjects;

        // Search: name, description, and techStack string
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(
                (p) =>
                    p.name.toLowerCase().includes(q) ||
                    (p.description ?? '').toLowerCase().includes(q) ||
                    (p.techStack   ?? '').toLowerCase().includes(q)
            );
        }

        // Status: ACTIVE | COMPLETED | ARCHIVED
        if (statusFilter) {
            result = result.filter((p) => p.status === statusFilter);
        }

        // Visibility: PUBLIC | PRIVATE
        if (visibilityFilter) {
            result = result.filter((p) => p.visibility === visibilityFilter);
        }

        return applySort(result, sortBy);
    }, [allProjects, search, statusFilter, visibilityFilter, sortBy]);

    // ── Helpers ───────────────────────────────────────────────────────────────
    const hasFilters = Boolean(search || statusFilter || visibilityFilter);

    function clearFilters() {
        setSearch('');
        setStatusFilter('');
        setVisibilityFilter('');
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (isError) {
        return <ProjectsError message={error?.message} onRetry={refetch} />;
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">

            {/* Header */}
            {/*
        NOTE: PendingInvitationsWidget is placed as a sibling here rather
        than passed into MyProjectsHeader, since that component's internal
        layout wasn't available to edit directly. If MyProjectsHeader
        already has a slot for secondary actions next to "Create Project",
        move this button there instead for a tighter layout.
      */}
            <div className="flex flex-wrap items-start justify-between gap-3">
                <MyProjectsHeader
                    totalCount={allProjects.length}
                    ownedCount={ownedCount}
                    onCreate={() => navigate('/projects/create')}
                />
                <PendingInvitationsWidget />
            </div>

            {/* Filters — hidden while loading */}
            {!isLoading && allProjects.length > 0 && (
                <ProjectFilters
                    search={search}
                    onSearchChange={setSearch}
                    statusFilter={statusFilter}
                    onStatusChange={setStatusFilter}
                    visibilityFilter={visibilityFilter}
                    onVisibilityChange={setVisibilityFilter}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                />
            )}

            {/* Result count when filtered */}
            {!isLoading && hasFilters && (
                <p className="text-xs text-[#6B6890]">
                    {filteredProjects.length} of {allProjects.length} project
                    {allProjects.length !== 1 ? 's' : ''}
                </p>
            )}

            {/* List */}
            <MyProjectsList
                projects={filteredProjects}
                isLoading={isLoading}
                currentUserId={currentUserId}
                onViewProject={(id) => navigate(`/projects/${id}`)}
                hasFilters={hasFilters}
                onClearFilters={clearFilters}
                onCreateProject={() => navigate('/projects/create')}
            />

        </div>
    );
}