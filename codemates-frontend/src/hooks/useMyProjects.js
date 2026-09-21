/**
 * src/hooks/useMyProjects.js
 *
 * React Query hooks for project data.
 *
 * Data flow:
 *   MyProjects.jsx
 *     → useMyProjects()
 *       → projectsApi.getMyProjects()
 *         → getMockProjects()          (VITE_USE_MOCK=true)
 *         → GET /api/projects/my       (VITE_USE_MOCK=false)
 *
 *   ProjectDetails.jsx (or any page needing a single project)
 *     → useProject(projectId)
 *       → projectsApi.getProjectById(projectId)
 *         → getMockProjectById(id)     (VITE_USE_MOCK=true)
 *         → GET /api/projects/{id}     (VITE_USE_MOCK=false)
 *
 * Cache key structure:
 *   ['projects', 'my']     → the full list for the current user
 *   ['projects', id]       → a single project by ID
 *
 * The keyed structure means React Query can share and invalidate them
 * independently. When a mutation later creates a project, invalidating
 * ['projects', 'my'] automatically refreshes the My Projects list.
 *
 * Usage:
 *   const { projects, isLoading, isError, error, refetch } = useMyProjects();
 *   const { project, isLoading } = useProject('proj-uuid-001');
 */

import { useQuery } from '@tanstack/react-query';
import { getMyProjects, getProjectById } from '../api/projectsApi';

// ── List hook ─────────────────────────────────────────────────────────────────

/**
 * Fetches and caches all projects the current user owns or has joined.
 *
 * Returns a normalised object so callers don't need to know React Query
 * internals:
 *
 *   projects   → data ?? []   (never undefined — safe to iterate directly)
 *   isLoading  → true on initial fetch
 *   isError    → true if all retries failed
 *   error      → Error object with .message and optional .status
 *   refetch    → manually re-trigger the query (used by the error state retry btn)
 */
export function useMyProjects() {
  const query = useQuery({
    queryKey: ['projects', 'my'],
    queryFn:  getMyProjects,
    staleTime:           1000 * 60 * 5,   // data is fresh for 5 minutes
    gcTime:              1000 * 60 * 10,  // keep in cache for 10 minutes
    retry:               2,
    refetchOnWindowFocus: false,
  });

  return {
    projects:  query.data ?? [],
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error,
    refetch:   query.refetch,
  };
}

// ── Single-project hook ───────────────────────────────────────────────────────

/**
 * Fetches and caches a single project by ID.
 *
 * Disabled when projectId is falsy so it's safe to call unconditionally
 * even when the ID comes from useParams() before the route resolves.
 *
 * Usage:
 *   const { project, isLoading, isError } = useProject(projectId);
 */
export function useProject(projectId) {
  const query = useQuery({
    queryKey: ['projects', projectId],
    queryFn:  () => getProjectById(projectId),
    enabled:  !!projectId,
    staleTime:           1000 * 60 * 5,
    gcTime:              1000 * 60 * 10,
    retry:               2,
    refetchOnWindowFocus: false,
  });

  return {
    project:   query.data ?? null,
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error,
    refetch:   query.refetch,
  };
}