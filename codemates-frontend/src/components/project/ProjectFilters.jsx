/**
 * Filter controls for Discover Projects: Tech Stack (multi-select),
 * Project Type (single-select), Required Experience (single-select),
 * and Availability/Team Needs (single-select, backed by project status).
 *
 * Fully controlled, no internal state, no hardcoded application data —
 * mirrors DeveloperFilters.jsx's pattern for consistency across pages.
 *
 * Props:
 * - techOptions            string[]
 * - typeOptions            string[]
 * - experienceOptions      string[]
 * - availabilityOptions    string[]
 * - selectedTech           string[]
 * - selectedType           string | null
 * - selectedExperience     string | null
 * - selectedAvailability   string | null
 * - onTechChange           (string[]) => void
 * - onTypeChange           (string | null) => void
 * - onExperienceChange     (string | null) => void
 * - onAvailabilityChange   (string | null) => void
 * - onClearAll             () => void   optional "clear filters" action
 */

const DEFAULT_TECH = ["React", "Node.js", "Python", "TypeScript", "Go", "Java", "ML / AI"];
const DEFAULT_TYPES = ["Open Source", "Startup", "Hackathon", "Side Project", "Academic"];
const DEFAULT_EXPERIENCE = ["Beginner", "Intermediate", "Advanced", "Expert"];
const DEFAULT_AVAILABILITY = ["Recruiting", "In Progress", "Completed"];

function chipClass(active) {
  return `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "border-[var(--cm-indigo)] bg-[var(--cm-indigo-soft)] text-[var(--cm-lavender)]"
      : "border-[var(--cm-border)] text-[var(--cm-text-dim)] hover:border-[var(--cm-border-strong)] hover:text-[var(--cm-text)]"
  }`;
}

function FilterGroup({ label, children }) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--cm-muted)]">
        {label}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

export default function ProjectFilters({
  techOptions = DEFAULT_TECH,
  typeOptions = DEFAULT_TYPES,
  experienceOptions = DEFAULT_EXPERIENCE,
  availabilityOptions = DEFAULT_AVAILABILITY,
  selectedTech = [],
  selectedType = null,
  selectedExperience = null,
  selectedAvailability = null,
  onTechChange,
  onTypeChange,
  onExperienceChange,
  onAvailabilityChange,
  onClearAll,
}) {
  const toggleTech = (tech) => {
    if (selectedTech.includes(tech)) {
      onTechChange?.(selectedTech.filter((t) => t !== tech));
    } else {
      onTechChange?.([...selectedTech, tech]);
    }
  };

  const toggleSingle = (value, current, onChange) => {
    onChange?.(current === value ? null : value);
  };

  const hasActiveFilters =
    selectedTech.length > 0 ||
    selectedType ||
    selectedExperience ||
    selectedAvailability;

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-5">
      <FilterGroup label="Tech Stack">
        {techOptions.map((tech) => (
          <button
            key={tech}
            type="button"
            onClick={() => toggleTech(tech)}
            aria-pressed={selectedTech.includes(tech)}
            className={chipClass(selectedTech.includes(tech))}
          >
            {tech}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup label="Project Type">
        {typeOptions.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => toggleSingle(type, selectedType, onTypeChange)}
            aria-pressed={selectedType === type}
            className={chipClass(selectedType === type)}
          >
            {type}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup label="Required Experience">
        {experienceOptions.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() =>
              toggleSingle(level, selectedExperience, onExperienceChange)
            }
            aria-pressed={selectedExperience === level}
            className={chipClass(selectedExperience === level)}
          >
            {level}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup label="Availability">
        {availabilityOptions.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() =>
              toggleSingle(status, selectedAvailability, onAvailabilityChange)
            }
            aria-pressed={selectedAvailability === status}
            className={chipClass(selectedAvailability === status)}
          >
            {status}
          </button>
        ))}
      </FilterGroup>

      {hasActiveFilters && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          className="self-start text-xs text-[var(--cm-muted)] underline-offset-2 hover:text-[var(--cm-text-dim)] hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}