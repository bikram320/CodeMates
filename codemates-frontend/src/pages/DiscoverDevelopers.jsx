import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
<<<<<<< Updated upstream
import { AlertTriangle, Users } from "lucide-react";
=======
import { AlertTriangle, Search, Users, UserGroup } from "lucide-react";
>>>>>>> Stashed changes

import PageHeader from "../components/layout/PageHeader"; 
import SuggestedDevelopers from "../components/dashboard/SuggestedDevelopers";  
import SearchBar from "../components/ui/SearchBar";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import DeveloperFilters from "../components/developer/DeveloperFilters";
import DeveloperGrid from "../components/developer/DeveloperGrid";
import DeveloperCard from "../components/developer/DeveloperCard";

import { useDevelopers } from "../hooks/useDevelopers";
<<<<<<< Updated upstream

/**
 * Main Discover Developers page.
 *
 * ── Data flow ─────────────────────────────────────────────────────────────────
 *   DiscoverDevelopers.jsx → useDevelopers() → discoveryApi.js → real backend
 *     (GET /api/discovery/search — see discoveryApi.js for exact params)
 *
 * The backend's search has no free-text param — only skills, experienceLevel,
 * interests and openToCollaborate. So `search` below is NOT sent to
 * useDevelopers()/the network at all; it filters client-side over whatever
 * page of (already filter-matched, up-to-50) results is currently loaded.
 * That also means typing in the search box no longer triggers the "updating"
 * spinner — only a real filter change (skills/experience/availability) does,
 * since only those actually cause a new request.
 *
 * `selectedAvailability` is one of DeveloperFilters' three option strings
 * ("Available" / "Open to offers" / "Not available"), but the backend's
 * `openToCollaborate` param is a plain boolean with no third state — so
 * toOpenToCollaborate() below collapses "Open to offers" into `true`
 * (documented there). "Not available" → false, nothing selected → omitted.
 *
 * `experienceLevel` is passed straight through unchanged — DeveloperFilters'
 * default options are Title Case ("Intermediate"), but every other enum-like
 * value elsewhere in this backend (NotificationType, project status/type, …)
 * is UPPER_SNAKE_CASE. user-profile-service's own enum (which defines the
 * valid values for ProfileSearchResult.experienceLevel) wasn't provided, so
 * this is unverified — if the casing doesn't match, every experience filter
 * will silently return zero results rather than error.
 *
 * `DeveloperCard` expects different field names than the backend returns
 * (`name` not `fullName`, `skills: string[]` not `[{skillName,...}]`, and an
 * `availability` label rather than an `isOpenToCollaborate` boolean) — so
 * toCardProps() below adapts one to the other; see its comments for the
 * "Open to offers" gap (the backend has no third state to map back to it).
 */
=======
import { useSuggestedDevelopers } from "../hooks/useSuggestedDevelopers";
import useAuth from "../hooks/useAuth";
import { TbUsersGroup } from "react-icons/tb";

>>>>>>> Stashed changes

function matchesSearchText(developer, search) {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return (
    developer.fullName?.toLowerCase().includes(term) ||
    developer.username?.toLowerCase().includes(term) ||
    developer.bio?.toLowerCase().includes(term) ||
    developer.skills?.some((s) => s.skillName?.toLowerCase().includes(term))
  );
}


function toOpenToCollaborate(availability) {
  if (!availability) return null;
  const v = availability.toLowerCase();
  if (v === "not available") return false;
  if (v === "available" || v === "open to offers") return true;
  return null; // an unrecognized custom option, if availabilityOptions is ever overridden
}


function toAvailabilityLabel(isOpenToCollaborate) {
  if (isOpenToCollaborate === true) return "Available";
  if (isOpenToCollaborate === false) return "Not available";
  return undefined; // unknown — DeveloperCard already skips a falsy availability
}

function toSuggestedShape(d) {
  const name = d.fullName || d.username;
  return {
    id: d.userId,
    userId: d.userId,
    name,
    username: d.username,
    initials: name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase(),
    avatarUrl: d.avatarUrl,
    experienceLevel: d.experienceLevel,
    bio: d.bio,
    skills: (d.skills ?? []).map((s) => ({ id: s.skillName, name: s.skillName })),
  };
}

/** Maps a real ProfileSearchResult onto the props DeveloperCard.jsx actually reads. */
function toCardProps(developer) {
  return {
    name: developer.fullName || developer.username,
    username: developer.username,
    avatarUrl: developer.avatarUrl,
    bio: developer.bio,
    skills: (developer.skills ?? []).map((s) => s.skillName).filter(Boolean),
    experienceLevel: developer.experienceLevel,
    availability: toAvailabilityLabel(developer.isOpenToCollaborate),
  };
}

export default function DiscoverDevelopers() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);

  const {
    developers,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useDevelopers({
<<<<<<< Updated upstream
    skills: selectedSkills,
    experienceLevel: selectedExperience,
    openToCollaborate: toOpenToCollaborate(selectedAvailability),
  });

  const visibleDevelopers = useMemo(
    () => developers.filter((d) => matchesSearchText(d, search)),
    [developers, search]
  );
=======
  skills: selectedSkills,
  experienceLevel: selectedExperience ? selectedExperience.toUpperCase() : null,
  openToCollaborate: toOpenToCollaborate(selectedAvailability),
  enabled: hasSearched,
});
  // Drop the signed-in user's own profile out of any developer list. See the
  // file header — neither backend endpoint does this for us.
  const excludeSelf = (list) =>
      currentUser?.userId ? list.filter((d) => d.userId !== currentUser.userId) : list;

  const visibleDevelopers = useMemo(
  () =>
    excludeSelf(developers)
      .filter((d) => matchesSearchText(d, search))
      .filter(
        (d) =>
          !selectedExperience ||
          d.experienceLevel?.toLowerCase() === selectedExperience.toLowerCase()
      ),
  [developers, search, selectedExperience, currentUser?.userId]
);
>>>>>>> Stashed changes

  function clearAllFilters() {
    setSearch("");
    setSelectedSkills([]);
    setSelectedExperience(null);
    setSelectedAvailability(null);
  }

  return (
<<<<<<< Updated upstream
    <div className="discover-developers-page">
      <div className="head-container">
        <PageHeader
          title="Discover Developers"
          description="Find developers to collaborate with."
        />
      </div>

      <div className="body-container mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="filters-container">
          <DeveloperFilters
            selectedSkills={selectedSkills}
            selectedExperience={selectedExperience}
            selectedAvailability={selectedAvailability}
            onSkillsChange={setSelectedSkills}
            onExperienceChange={setSelectedExperience}
            onAvailabilityChange={setSelectedAvailability}
            onClearAll={clearAllFilters}
          />
=======
      <div className="discover-developers-page">
        <div className="head-container">
          <div className="border-b border-[var(--cm-border)] pb-5">
            <div className="flex items-center gap-3">
              <UserGroup size={28} className="shrink-0 text-indigo-500" aria-hidden="true" />
              <h1 className="text-2xl font-semibold tracking-tight text-[var(--cm-text)]">
                Discover Developers
              </h1>
            </div>
            <p className="mt-1.5 text-sm text-[var(--cm-text-dim)]">
              Find developers to collaborate with.
            </p>
          </div>
>>>>>>> Stashed changes
        </div>

        <div className="results-container flex flex-col gap-5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name, username, skill, or bio..."
          />

<<<<<<< Updated upstream
          {/* Result count + a quiet "updating" indicator while a filter
=======
          <div className="results-container flex flex-col gap-5">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <SearchBar
                  value={search}
                  onChange={setSearch}
                  onSubmit={handleSearchSubmit}
                  placeholder="Search by name, username, skill, or bio..."
                />
              </div>
              <button
                type="button"
                onClick={() => handleSearchSubmit(search)}
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#4F46E5] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"
              >
                <Search size={15} aria-hidden="true" />
                Search
              </button>
            </div>

            {/* Result count + a quiet "updating" indicator while a filter
>>>>>>> Stashed changes
              change is in flight (isFetching) but old data is still showing.
              Typing in the search box doesn't trigger this — see file header. */}
          {!isLoading && !isError && (
            <div className="flex items-center gap-2 text-sm text-[var(--cm-muted)]">
              <span>
                {visibleDevelopers.length} developer{visibleDevelopers.length !== 1 ? "s" : ""} found
              </span>
              {isFetching && <Spinner size="sm" />}
            </div>
          )}

<<<<<<< Updated upstream
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : isError ? (
            <EmptyState
              icon={AlertTriangle}
              title="Something went wrong"
              description={
                error?.message || "Couldn't load developers. Please try again."
              }
              action={
                <Button variant="outline" onClick={refetch}>
                  Try again
                </Button>
              }
            />
          ) : visibleDevelopers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No developers found"
              description="Try adjusting your filters or search terms."
              action={
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <DeveloperGrid
              developers={visibleDevelopers}
              renderCard={(developer) => (
                <DeveloperCard
                  key={developer.userId}
                  {...toCardProps(developer)}
                  to={`/discover/developers/${developer.username}`}
                  onViewProfile={() =>
                    navigate(`/discover/developers/${developer.username}`)
                  }
=======
            {!hasSearched ? (
                <div className="flex flex-col gap-6">
                  <EmptyState
                    icon={Search}
                    title="Search for developers"
                    description="Type a name, username, skill, or bio and press Enter, or pick a filter on the left to get started."
                  />
                  {isLoadingSuggestions ? (
                    <div className="flex justify-center py-10">
                      <Spinner size="lg" />
                    </div>
                  ) : suggestions.length > 0 ? (
                    <SuggestedDevelopers
                      developers={suggestions.map(toSuggestedShape)}
                      title="Suggested for you"
                      showViewAll={false}
                      className="flex flex-col gap-4"
                      gridClassName="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                    />
                  ) : null}
                </div>
              ) : isLoading ? (
                <div className="flex justify-center py-20">
                  <Spinner size="lg" />
                </div>
            ) : isError ? (
                <EmptyState
                    icon={AlertTriangle}
                    title="Something went wrong"
                    description={
                        error?.message || "Couldn't load developers. Please try again."
                    }
                    action={
                      <Button variant="outline" onClick={refetch}>
                        Try again
                      </Button>
                    }
>>>>>>> Stashed changes
                />
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
}