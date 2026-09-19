import { useState } from "react";
import { AlertTriangle, FolderGit2 } from "lucide-react";

import PageHeader from "../components/layout/PageHeader";
import SearchBar from "../components/ui/SearchBar";
import Button from "../components/ui/Button";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";
import ProjectFilters from "../components/project/ProjectFilters";
import ProjectCard from "../components/project/ProjectCard";

import { useProjects } from "../hooks/useProjects";

/**
 * Discover Projects page.
 *
 * Data flow: this page -> useProjects() -> projectApi.getProjects()
 * -> mock data (see hooks/useProjects.js and api/projectApi.js).
 *
 * All filter state lives here and is passed down as props — ProjectFilters
 * and SearchBar hold no state of their own.
 */
export default function DiscoverProjects() {
  const [search, setSearch] = useState("");
  const [selectedTech, setSelectedTech] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [selectedAvailability, setSelectedAvailability] = useState(null);

  const {
    projects,
    total,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useProjects({
    search,
    techStack: selectedTech,
    projectType: selectedType,
    experience: selectedExperience,
    availability: selectedAvailability,
  });

  function clearAllFilters() {
    setSearch("");
    setSelectedTech([]);
    setSelectedType(null);
    setSelectedExperience(null);
    setSelectedAvailability(null);
  }

  return (
    <div className="discover-projects-page">
      <div className="head-container">
        <PageHeader
          title="Discover Projects"
          description="Browse projects looking for collaborators."
        />
      </div>

      <div className="body-container mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="filters-container">
          <ProjectFilters
            selectedTech={selectedTech}
            selectedType={selectedType}
            selectedExperience={selectedExperience}
            selectedAvailability={selectedAvailability}
            onTechChange={setSelectedTech}
            onTypeChange={setSelectedType}
            onExperienceChange={setSelectedExperience}
            onAvailabilityChange={setSelectedAvailability}
            onClearAll={clearAllFilters}
          />
        </div>

        <div className="results-container flex flex-col gap-5">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by project name, description, or tech..."
          />

          {/* Result count + a quiet "updating" indicator while a filter
              change is in flight (isFetching) but old data is still showing. */}
          {!isLoading && !isError && (
            <div className="flex items-center gap-2 text-sm text-[var(--cm-muted)]">
              <span>
                {total} project{total !== 1 ? "s" : ""} found
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
                error?.message || "Couldn't load projects. Please try again."
              }
              action={
                <Button variant="outline" onClick={refetch}>
                  Try again
                </Button>
              }
            />
          ) : projects.length === 0 ? (
            <EmptyState
              icon={FolderGit2}
              title="No projects found"
              description="Try adjusting your filters or search terms."
              action={
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} {...project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}