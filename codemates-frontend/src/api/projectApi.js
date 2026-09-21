import { projects as mockProjects } from "../mock/projectMock";

// Simulated network latency so loading states are visible during development.
const SIMULATED_DELAY_MS = 600;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesSearch(project, search) {
  if (!search) return true;
  const term = search.trim().toLowerCase();
  if (!term) return true;

  return (
    project.name.toLowerCase().includes(term) ||
    project.shortDescription.toLowerCase().includes(term) ||
    project.techStack.some((tech) => tech.toLowerCase().includes(term))
  );
}

// A project matches if it has ANY of the selected tech (OR within the
// facet) — same reasoning as skills filtering on Discover Developers.
function matchesTechStack(project, techStack) {
  if (!techStack || techStack.length === 0) return true;
  return techStack.some((tech) => project.techStack.includes(tech));
}

function matchesProjectType(project, projectType) {
  if (!projectType) return true;
  return project.projectType === projectType;
}

function matchesExperience(project, experience) {
  if (!experience) return true;
  return project.requiredExperience === experience;
}

// "Availability" reads the same `status` field also shown on the card —
// see the note in ProjectFilters.jsx/ProjectCard.jsx for why these aren't
// two separate fields.
function matchesAvailability(project, availability) {
  if (!availability) return true;
  return project.status === availability;
}

/**
 * Fetch projects matching the given filters.
 *
 * Resolves against local mock data with a simulated delay for now. The
 * signature is shaped like a real API call so swapping the body for a
 * real request later doesn't require touching any caller (useProjects.js,
 * DiscoverProjects.jsx stay exactly as they are).
 *
 * @param {Object} params
 * @param {string} [params.search]
 * @param {string[]} [params.techStack]
 * @param {string|null} [params.projectType]
 * @param {string|null} [params.experience]
 * @param {string|null} [params.availability]
 * @returns {Promise<{ projects: object[], total: number }>}
 */
export async function getProjects(params = {}) {
  const {
    search = "",
    techStack = [],
    projectType = null,
    experience = null,
    availability = null,
  } = params;

  await delay(SIMULATED_DELAY_MS);

  const results = mockProjects.filter(
    (project) =>
      matchesSearch(project, search) &&
      matchesTechStack(project, techStack) &&
      matchesProjectType(project, projectType) &&
      matchesExperience(project, experience) &&
      matchesAvailability(project, availability)
  );

  return { projects: results, total: results.length };

  /*
   * Real backend version (once Spring Boot is ready) — same signature,
   * so nothing above this function needs to change:
   *
   * import client from "./client";
   *
   * export async function getProjects(params = {}) {
   *   const { search = "", techStack = [], projectType = null, experience = null, availability = null } = params;
   *   const response = await client.get("/api/projects", {
   *     params: { search, techStack: techStack.join(","), projectType, experience, availability },
   *   });
   *   return response.data; // expect { projects, total } from the API
   * }
   */
}