import { useState } from "react";
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

/**
 * Main Discover Developers page.
 *
 * Data flow: this page -> useDevelopers() -> developerApi.getDevelopers()
 * -> mock data (see hooks/useDevelopers.js and api/developerApi.js).
 *
 * All filter state lives here and is passed down as props — DeveloperFilters
 * and SearchBar hold no state of their own, so this is the single place
 * that knows what the current search/filter combination is.
 */
export default function DiscoverDevelopers() {
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);

  const {
    developers,
    total,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useDevelopers({
    search,
    skills: selectedSkills,
    experience: selectedExperience,
    availability: selectedAvailability,
  });

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

          {/* Result count + a quiet "updating" indicator while a filter
              change is in flight (isFetching) but old data is still showing. */}
          {!isLoading && !isError && (
            <div className="flex items-center gap-2 text-sm text-[var(--cm-muted)]">
              <span>
                {total} developer{total !== 1 ? "s" : ""} found
              </span>
              {isFetching && <Spinner size="sm" />}
            </div>
          )}

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
          ) : developers.length === 0 ? (
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
              developers={developers}
              renderCard={(developer) => (
                <DeveloperCard
                  key={developer.id}
                  {...developer}
                  // Guessed navigation props — DeveloperCard.jsx's real "View
                  // Profile" button needs one of these; adjust to match
                  // whichever it actually expects. Both point to the same route.
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