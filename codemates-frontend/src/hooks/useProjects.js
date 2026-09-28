import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { discoverProjects } from "../api/projectApi";

/**
 * DiscoverProjects.jsx → useProjects(filters) → projectApi.discoverProjects()
 * → real backend (GET /api/projects/discover — see projectApi.js).
 *
 * Previously this called an undefined `getProjects()` against a mock that
 * was never wired to anything real ("getProjects is not defined" on every
 * load). There was also no backend endpoint at all until ProjectController/
 * ProjectService added /discover — see those files for what changed and
 * what's still a stub (projectType/requiredExperience filters are accepted
 * but not yet backed by real columns on Project).
 *
 * `search` (free text) is NOT sent to the backend — same reasoning as
 * DiscoverDevelopers.jsx's `search`: the endpoint has no free-text param,
 * so it's applied client-side over whatever page of (already filtered,
 * capped) results came back.
 *
 * ProjectResponse's real fields (id, ownerUserId, name, description,
 * githubRepoUrl, status, visibility, techStack, maxMembers, memberCount,
 * createdAt) don't match what ProjectCard.jsx reads (shortDescription,
 * techStack as an array, projectType, requiredExperience, teamSize
 * {current,max}, requiredRoles) — toCardProps() below adapts what it can
 * from real data (techStack CSV → array, teamSize from memberCount/
 * maxMembers, shortDescription truncated from description) and leaves
 * projectType/requiredExperience/requiredRoles undefined, since there's
 * genuinely no backing data for them yet (ProjectCard already renders fine
 * with those omitted — it guards each with `&&`).
 *
 *   const { projects, total, isLoading, isError, error } = useProjects({
 *     search, techStack, projectType, experience, availability,
 *   });
 *
 * @param {Object} filters
 * @param {string} [filters.search]
 * @param {string[]} [filters.techStack]
 * @param {string|null} [filters.projectType]
 * @param {string|null} [filters.experience]
 * @param {string|null} [filters.availability]  maps to the backend's `status`
 *   the same way DeveloperFilters' Availability maps to openToCollaborate —
 *   see toStatus() below for the exact mapping and its gap.
 */

/**
 * DiscoverProjectFilters' Availability options are "Recruiting" / "In
 * Progress" / "Completed" — the backend's real status enum is
 * ACTIVE | COMPLETED | ARCHIVED (see VALID_STATUSES in ProjectService.java).
 * There's no backend concept of "Recruiting" (a project that's ACTIVE but
 * still below maxMembers) — that would need to be computed from
 * memberCount vs maxMembers, not filtered server-side. So for now:
 *   "In Progress" → ACTIVE (closest real status)
 *   "Completed"   → COMPLETED
 *   "Recruiting"  → omitted (not sent — sending ACTIVE here would also
 *                   incorrectly hide ACTIVE-but-full projects filtered
 *                   for a different reason than what the label promises)
 * Flag this to whoever owns the filter UI if "Recruiting" needs to be a
 * real, separate signal — it likely wants a `memberCount < maxMembers`
 * check added to discoverProjects() on the backend instead.
 */
function toStatus(availability) {
  if (availability === "In Progress") return "ACTIVE";
  if (availability === "Completed") return "COMPLETED";
  return null;
}

function matchesSearchText(project, search) {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return (
      project.name?.toLowerCase().includes(term) ||
      project.description?.toLowerCase().includes(term) ||
      project.techStack?.toLowerCase().includes(term)
  );
}

/** Maps a real ProjectResponse onto the props ProjectCard.jsx actually reads. */
function toCardProps(project) {
  return {
    id: project.id,
    name: project.name,
    shortDescription: project.description
        ? project.description.length > 140
            ? `${project.description.slice(0, 140).trim()}…`
            : project.description
        : undefined,
    techStack: (project.techStack ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    status: project.status === "ACTIVE" ? "Recruiting" : project.status === "COMPLETED" ? "Completed" : project.status,
    teamSize: { current: project.memberCount ?? 0, max: project.maxMembers ?? 0 },
    // Not backed by real data yet — see this file's header. ProjectCard
    // already skips each of these cleanly when undefined.
    projectType: project.projectType,
    requiredExperience: project.requiredExperience,
    requiredRoles: project.requiredRoles,
  };
}

export function useProjects(filters = {}) {
  const {
    search = "",
    techStack = [],
    projectType = null,
    experience = null,
    availability = null,
  } = filters;

  const status = toStatus(availability);

  const query = useQuery({
    queryKey: ["projects", "discover", { techStack, projectType, experience, status }],
    queryFn: () =>
        discoverProjects({
          techStack,
          projectType,
          requiredExperience: experience,
          status,
        }),
    retry: 1,
  });

  const rawProjects = query.data ?? [];

  const projects = useMemo(
      () => rawProjects.filter((p) => matchesSearchText(p, search)).map(toCardProps),
      [rawProjects, search]
  );

  return {
    projects,
    total: projects.length,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}