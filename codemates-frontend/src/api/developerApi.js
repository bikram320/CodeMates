import { developers as mockDevelopers } from "../mock/developerMock";

// Simulated network latency so loading states are visible during development.
const SIMULATED_DELAY_MS = 600;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function matchesSearch(developer, search) {
  if (!search) return true;
  const term = search.trim().toLowerCase();
  if (!term) return true;

  return (
    developer.name.toLowerCase().includes(term) ||
    developer.username.toLowerCase().includes(term) ||
    developer.bio.toLowerCase().includes(term) ||
    developer.skills.some((skill) => skill.toLowerCase().includes(term))
  );
}

// A developer matches if they have ANY of the selected skills (OR within
// the facet) — picking more skill chips broadens results rather than
// narrowing to zero. Switch to .every(...) below if you'd rather require
// all selected skills to be present.
function matchesSkills(developer, skills) {
  if (!skills || skills.length === 0) return true;
  return skills.some((skill) => developer.skills.includes(skill));
}

function matchesExperience(developer, experience) {
  if (!experience) return true;
  return developer.experienceLevel === experience;
}

function matchesAvailability(developer, availability) {
  if (!availability) return true;
  return developer.availability === availability;
}

/**
 * Fetch developers matching the given filters.
 *
 * Right now this resolves against local mock data with a simulated delay.
 * The signature is deliberately shaped like a real API call so swapping
 * the body for a real request later doesn't require touching any caller
 * (useDevelopers.js, DiscoverDevelopers.jsx stay exactly as they are).
 *
 * @param {Object} filters
 * @param {string} [filters.search]
 * @param {string[]} [filters.skills]
 * @param {string|null} [filters.experience]
 * @param {string|null} [filters.availability]
 * @returns {Promise<{ developers: object[], total: number }>}
 */
export async function getDevelopers(filters = {}) {
  const { search = "", skills = [], experience = null, availability = null } = filters;

  await delay(SIMULATED_DELAY_MS);

  const results = mockDevelopers.filter(
    (developer) =>
      matchesSearch(developer, search) &&
      matchesSkills(developer, skills) &&
      matchesExperience(developer, experience) &&
      matchesAvailability(developer, availability)
  );

  return { developers: results, total: results.length };

  /*
   * Real backend version (once Spring Boot is ready) — same signature,
   * so nothing above this function needs to change:
   *
   * import client from "./client";
   *
   * export async function getDevelopers(filters = {}) {
   *   const { search = "", skills = [], experience = null, availability = null } = filters;
   *   const response = await client.get("/api/developers", {
   *     params: { search, skills: skills.join(","), experience, availability },
   *   });
   *   return response.data; // expect { developers, total } from the API
   * }
   *
   * Adjust to match however client.js actually calls out (axios instance,
   * fetch wrapper, etc.) — I haven't seen that file's contents.
   */
}