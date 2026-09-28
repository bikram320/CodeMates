import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Search, Users } from "lucide-react";

import PageHeader from "../components/layout/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import DeveloperFilters from "../components/developer/DeveloperFilters";
import DeveloperGrid from "../components/developer/DeveloperGrid";
import DeveloperCard from "../components/developer/DeveloperCard";

import { useDevelopers } from "../hooks/useDevelopers";
import { useSuggestedDevelopers } from "../hooks/useSuggestedDevelopers";
import useAuth from "../hooks/useAuth";

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
 *
 * ── Why the fetch is gated behind `hasSearched()` ────────────────────────────
 * DiscoveryService has no notion of "no filters = no results" — an unfiltered
 * request to /api/discovery/search just returns up to 50 developers. Calling
 * useDevelopers() unconditionally on mount therefore listed everyone before
 * the user had done anything. That's wrong: developers should only appear
 * once the user has actually expressed intent to look for someone, via a
 * filter or a submitted search.
 *
 * So the query is only enabled once:
 *   - the user has picked at least one filter (skills/experience/availability), or
 *   - the user has pressed Enter in the search box with non-empty text
 *     ("submittedSearch" below — typing alone does NOT fetch, since the
 *     backend can't use free text anyway and firing a request per keystroke
 *     would be pointless network chatter).
 * Before either of those, the page shows a "start searching" prompt instead
 * of an empty/loading grid. Clearing all filters returns to that same
 * pre-search state rather than re-listing everyone.
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
 *
 * ── Excluding the signed-in user's own profile ───────────────────────────────
 * Neither /api/discovery/search nor the suggested-developers endpoint filters
 * out the caller's own profile server-side, so both the search results and
 * the pre-search "Suggested for you" grid could otherwise show your own card.
 * excludeSelf() below drops any ProfileSearchResult whose userId matches the
 * signed-in user's id, sourced from useAuth() (the cached UserInfoResponse —
 * see useAuth.js — carries a real userId once a session exists). If the
 * session is still resolving to the `profileUnknown` placeholder (e.g. right
 * after an OAuth redirect, before any UserInfoResponse is cached), there's no
 * id to compare against yet, so nothing is excluded until it resolves.
 */

/** Not sent to the backend — see the file header. Matches on whatever's already loaded. */
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

/**
 * DeveloperFilters' "Availability" is 3-way ("Available" / "Open to offers" /
 * "Not available"); the backend's `openToCollaborate` is a plain boolean.
 * "Open to offers" is collapsed into `true` — closer to "open" than not, and
 * there's no backend concept to map it to more precisely than that.
 */
function toOpenToCollaborate(availability) {
  if (!availability) return null;
  const v = availability.toLowerCase();
  if (v === "not available") return false;
  if (v === "available" || v === "open to offers") return true;
  return null; // an unrecognized custom option, if availabilityOptions is ever overridden
}

/**
 * The reverse direction: DeveloperCard shows a single "availability" label,
 * but the backend only has the boolean isOpenToCollaborate — there's no
 * server-side "Open to offers" state to reconstruct, so that middle option
 * only ever appears as a filter choice, never as a label on a card.
 */
function toAvailabilityLabel(isOpenToCollaborate) {
  if (isOpenToCollaborate === true) return "Available";
  if (isOpenToCollaborate === false) return "Not available";
  return undefined; // unknown — DeveloperCard already skips a falsy availability
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
  const { user: currentUser } = useAuth();

  const [search, setSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);

  // True once the user has submitted a non-empty search (pressed Enter in
  // the search box). Distinct from `search` itself, which updates on every
  // keystroke and is only used for client-side filtering — see file header.
  const [submittedSearch, setSubmittedSearch] = useState(false);

  const hasActiveFilters =
      selectedSkills.length > 0 || Boolean(selectedExperience) || Boolean(selectedAvailability);

  // Gate for whether we're allowed to hit the backend / show results at all.
  // `submittedSearch` alone is NOT enough: it's sticky (only reset by "Clear
  // all filters"), so if it were used by itself, backspacing the search box
  // back to empty would still count as "searched" and matchesSearchText's
  // "empty term matches everything" rule would then show the full up-to-50
  // unfiltered list again — the exact bug this line fixes. Requiring the
  // CURRENT text to still be non-empty means clearing the box (with no
  // filters active) correctly drops back to the pre-search state.
  const hasSearched = hasActiveFilters || (submittedSearch && search.trim() !== "");

  const {
    developers,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useDevelopers({
    skills: selectedSkills,
    experienceLevel: selectedExperience,
    openToCollaborate: toOpenToCollaborate(selectedAvailability),
    enabled: hasSearched,
  });

  // Drop the signed-in user's own profile out of any developer list. See the
  // file header — neither backend endpoint does this for us.
  const excludeSelf = (list) =>
      currentUser?.userId ? list.filter((d) => d.userId !== currentUser.userId) : list;

  const visibleDevelopers = useMemo(
      () => excludeSelf(developers).filter((d) => matchesSearchText(d, search)),
      [developers, search, currentUser?.userId]
  );

  // Only relevant/fetched in the pre-search state — see useSuggestedDevelopers.js
  // for how these are resolved (ML top matches, joined against profile data).
  const {
    suggestions: rawSuggestions,
    isLoading: isLoadingSuggestions,
  } = useSuggestedDevelopers(6);

  const suggestions = useMemo(
      () => excludeSelf(rawSuggestions),
      [rawSuggestions, currentUser?.userId]
  );

  function handleSearchSubmit(value) {
    if (value.trim()) {
      setSubmittedSearch(true);
    }
  }

  function clearAllFilters() {
    setSearch("");
    setSelectedSkills([]);
    setSelectedExperience(null);
    setSelectedAvailability(null);
    setSubmittedSearch(false);
  }

  return (
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
          </div>

          <div className="results-container flex flex-col gap-5">
            <SearchBar
                value={search}
                onChange={setSearch}
                onSubmit={handleSearchSubmit}
                placeholder="Search by name, username, skill, or bio..."
            />

            {/* Result count + a quiet "updating" indicator while a filter
              change is in flight (isFetching) but old data is still showing.
              Only shown once a search has actually happened. */}
            {hasSearched && !isLoading && !isError && (
                <div className="flex items-center gap-2 text-sm text-[var(--cm-muted)]">
              <span>
                {visibleDevelopers.length} developer{visibleDevelopers.length !== 1 ? "s" : ""} found
              </span>
                  {isFetching && <Spinner size="sm" />}
                </div>
            )}

            {!hasSearched ? (
                suggestions.length > 0 ? (
                    <div className="flex flex-col gap-4">
                      <h2 className="text-sm font-medium text-[var(--cm-muted)]">
                        Suggested for you
                      </h2>
                      <DeveloperGrid
                          developers={suggestions}
                          renderCard={(developer) => (
                              <DeveloperCard
                                  key={developer.userId}
                                  {...toCardProps(developer)}
                                  to={`/discover/developers/${developer.username}`}
                                  onViewProfile={() =>
                                      navigate(`/discover/developers/${developer.username}`)
                                  }
                              />
                          )}
                      />
                    </div>
                ) : isLoadingSuggestions ? (
                    <div className="flex justify-center py-20">
                      <Spinner size="lg" />
                    </div>
                ) : (
                    <EmptyState
                        icon={Search}
                        title="Search for developers"
                        description="Type a name, username, skill, or bio and press Enter, or pick a filter on the left to get started."
                    />
                )
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
                        />
                    )}
                />
            )}
          </div>
        </div>
      </div>
  );
}