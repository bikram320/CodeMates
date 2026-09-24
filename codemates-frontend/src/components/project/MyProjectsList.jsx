/**
 * MyProjectsList
 *
 * Renders the list of project cards, the loading skeleton, or an
 * appropriate empty state.
 *
 * Kept intentionally thin — all filtering and sorting logic lives
 * in the parent (MyProjects.jsx) so this component is purely presentational.
 *
 * Props:
 *   projects        {Array}    filtered + sorted projects to display
 *   isLoading       {boolean}
 *   onViewProject   {fn}       called with projectId when a card is clicked
 *   hasFilters      {boolean}  true when any filter/search is active
 *   onClearFilters  {fn}
 *   onCreateProject {fn}
 */

import { FolderKanban, SearchX, Plus } from 'lucide-react';
import MyProjectCard from './MyProjectCard';

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Pulse({ className }) {
  return <div className={`bg-[#1D1A40] rounded animate-pulse ${className}`} />;
}

function ProjectCardSkeleton() {
  return (
    <div className="card p-5 space-y-4">
      {/* Badges row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Pulse className="h-5 w-16 rounded-full" />
          <Pulse className="h-5 w-20 rounded" />
        </div>
        <Pulse className="h-5 w-20 rounded" />
      </div>
      {/* Name */}
      <div className="space-y-2">
        <Pulse className="h-5 w-36" />
        <Pulse className="h-4 w-full" />
        <Pulse className="h-4 w-4/5" />
      </div>
      {/* Tech chips */}
      <div className="flex gap-2">
        <Pulse className="h-5 w-12 rounded" />
        <Pulse className="h-5 w-16 rounded" />
        <Pulse className="h-5 w-10 rounded" />
      </div>
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between">
          <Pulse className="h-3 w-24" />
          <Pulse className="h-3 w-8" />
        </div>
        <Pulse className="h-1 w-full rounded-full" />
      </div>
      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-4">
          <Pulse className="h-3 w-20" />
          <Pulse className="h-3 w-16" />
        </div>
        <Pulse className="h-4 w-24 rounded" />
      </div>
    </div>
  );
}

// ── Empty states ──────────────────────────────────────────────────────────────

function FilteredEmptyState({ onClearFilters }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#1D1A40] flex items-center justify-center mb-4">
        <SearchX size={22} className="text-[#2E2A66]" />
      </div>
      <h3 className="text-sm font-semibold text-[#F5F5F5] mb-1">
        No projects match your filters
      </h3>
      <p className="text-xs text-[#6B6890] mb-5 max-w-xs">
        Try different search terms or adjust the filters.
      </p>
      <button
        onClick={onClearFilters}
        className="btn-outline text-xs px-4 py-2"
      >
        Clear all filters
      </button>
    </div>
  );
}

function BlankEmptyState({ onCreateProject }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-xl bg-[#1D1A40] flex items-center justify-center mb-5">
        <FolderKanban size={26} className="text-[#2E2A66]" />
      </div>
      <h3 className="text-base font-semibold text-[#F5F5F5] mb-2">
        No projects yet
      </h3>
      <p className="text-sm text-[#8B86B8] mb-6 max-w-xs leading-relaxed">
        Create your first project and start collaborating with developers.
      </p>
      <button
        onClick={onCreateProject}
        className="btn-primary text-sm"
      >
        <Plus size={15} />
        Create a project
      </button>
    </div>
  );
}

// ── List ──────────────────────────────────────────────────────────────────────

export default function MyProjectsList({
  projects,
  isLoading,
  onViewProject,
  hasFilters,
  onClearFilters,
  onCreateProject,
}) {
  // Loading — show 3 skeleton cards
  if (isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading projects…">
        {[0, 1, 2].map((i) => (
          <ProjectCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty — differentiate between "no results" and "no projects at all"
  if (projects.length === 0) {
    return hasFilters
      ? <FilteredEmptyState onClearFilters={onClearFilters} />
      : <BlankEmptyState onCreateProject={onCreateProject} />;
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => (
        <MyProjectCard
          key={project.id}
          project={project}
          onView={() => onViewProject(project.id)}
        />
      ))}
    </div>
  );
}