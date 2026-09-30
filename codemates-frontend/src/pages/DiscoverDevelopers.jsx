import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Users } from "lucide-react";

import PageHeader from "../components/layout/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import DeveloperFilters from "../components/developer/DeveloperFilters";
import DeveloperGrid from "../components/developer/DeveloperGrid";
import DeveloperCard from "../components/developer/DeveloperCard";

import { useDevelopers } from "../hooks/useDevelopers";
import { useDashboard } from "../hooks/useDashboard";
import { useAuth } from "../hooks/useAuth";

/**
 * Main Discover Developers page.
 *
 * ── Two modes ─────────────────────────────────────────────────────────────────
 *   1. Nothing typed and no filter chosen → show "Suggested for you", taken from
 *      the same dashboard response the Dashboard page uses (shared react-query
 *      cache under ['dashboard'], so there's no extra request if the user came
 *      from the dashboard).
 *   2. Search text or any filter active → show real search results from
 *      useDevelopers() (GET /api/discovery/search), as before.
 *
 * In both modes the logged-in user's own profile is removed.
 *
 * ── Data flow (search mode) ───────────────────────────────────────────────────
 *   DiscoverDevelopers.jsx → useDevelopers() → discoveryApi.js → real backend
 *
 * The backend's search has no free-text param — only skills, experienceLevel,
 * interests and openToCollaborate. So `search` is NOT sent to the network; it
 * filters client-side over whatever page of results is currently loaded.
 *
 * `selectedAvailability` is one of DeveloperFilters' three option strings, but
 * the backend's `openToCollaborate` is a boolean, so toOpenToCollaborate()
 * collapses "Open to offers" into `true`.
 *
 * `experienceLevel` is passed through unchanged (casing unverified — see the
 * original note: a mismatch would silently return zero results).
 *
 * Suggested developers (dashboard shape: id, fullName, username, avatarUrl,
 * bio, skills[{name}]) and search results (userId, fullName, username,
 * skills[{skillName}], isOpenToCollaborate) differ slightly, so toCardProps()
 * handles both.
 */

/** Not sent to the backend — matches on whatever's already loaded. */
function matchesSearchText(developer, search) {
  const term = search.trim().toLowerCase();
  if (!term) return true;
  return (
      developer.fullName?.toLowerCase().includes(term) ||
      developer.username?.toLowerCase().includes(term) ||
      developer.bio?.toLowerCase().includes(term) ||
      developer.skills?.some((s) =>
          (s.skillName ?? s.name)?.toLowerCase().includes(term)
      )
  );
}

function toOpenToCollaborate(availability) {
  if (!availability) return null;
  const v = availability.toLowerCase();
  if (v === "not available") return false;
  if (v === "available" || v === "open to offers") return true;
  return null;
}

function toAvailabilityLabel(isOpenToCollaborate) {
  if (isOpenToCollaborate === true) return "Available";
  if (isOpenToCollaborate === false) return "Not available";
  return undefined; // unknown (e.g. suggested developers) — the card skips it
}

/** Maps either a search result or a suggested developer onto DeveloperCard's props. */
function toCardProps(developer) {
  return {
    name: developer.fullName || developer.username,
    username: developer.username,
    avatarUrl: developer.avatarUrl,
    bio: developer.bio,
    skills: (developer.skills ?? [])
        .map((s) => s.skillName ?? s.name)
        .filter(Boolean),
    experienceLevel: developer.experienceLevel,
    availability: toAvailabilityLabel(developer.isOpenToCollaborate),
  };
}

export default function DiscoverDevelopers() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const { data: dashboard, isLoading: isDashboardLoading } = useDashboard();

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
    skills: selectedSkills,
    experienceLevel: selectedExperience,
    openToCollaborate: toOpenToCollaborate(selectedAvailability),
  });

  // The logged-in user's identity. useAuth() only knows userId (and not even
  // that right after a GitHub login), while the dashboard's user has the
  // username — so check both.
  const me = dashboard?.user;
  const isSelf = (d) => {
    const myUsername = me?.username?.toLowerCase();
    const myIds = [authUser?.userId, me?.userId, me?.id].filter(Boolean);
    const theirId = d.userId ?? d.id;
    return (
        (myUsername && d.username?.toLowerCase() === myUsername) ||
        (theirId != null && myIds.includes(theirId))
    );
  };

  const hasActiveQuery =
      search.trim() !== "" ||
      selectedSkills.length > 0 ||
      !!selectedExperience ||
      !!selectedAvailability;

  const suggestedDevelopers = useMemo(
      () => (dashboard?.suggestedDevelopers ?? []).filter((d) => !isSelf(d)),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [dashboard, authUser]
  );

  const searchResults = useMemo(
      () =>
          developers
              .filter((d) => !isSelf(d))
              .filter((d) => matchesSearchText(d, search)),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [developers, search, dashboard, authUser]
  );

  const visibleDevelopers = hasActiveQuery ? searchResults : suggestedDevelopers;
  const showLoading = hasActiveQuery ? isLoading : isDashboardLoading;
  const showError = hasActiveQuery && isError;

  function clearAllFilters() {
    setSearch("");
    setSelectedSkills([]);
    setSelectedExperience(null);
    setSelectedAvailability(null);
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
                placeholder="Search by name, username, skill, or bio..."
            />

            {!showLoading && !showError && (
                <div className="flex items-center gap-2 text-sm text-[var(--cm-muted)]">
              <span>
                {hasActiveQuery
                    ? `${visibleDevelopers.length} developer${
                        visibleDevelopers.length !== 1 ? "s" : ""
                    } found`
                    : "Suggested for you"}
              </span>
                  {hasActiveQuery && isFetching && <Spinner size="sm" />}
                </div>
            )}

            {showLoading ? (
                <div className="flex justify-center py-20">
                  <Spinner size="lg" />
                </div>
            ) : showError ? (
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
                    title={hasActiveQuery ? "No developers found" : "No suggestions yet"}
                    description={
                      hasActiveQuery
                          ? "Try adjusting your filters or search terms."
                          : "Search by name or skill, or use the filters, to find developers."
                    }
                    action={
                      hasActiveQuery ? (
                          <Button variant="outline" onClick={clearAllFilters}>
                            Clear filters
                          </Button>
                      ) : undefined
                    }
                />
            ) : (
                <DeveloperGrid
                    developers={visibleDevelopers}
                    renderCard={(developer) => (
                        <DeveloperCard
                            key={developer.userId ?? developer.id ?? developer.username}
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