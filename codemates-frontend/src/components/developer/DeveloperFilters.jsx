/**
 * Filter controls for Discover Developers: Skills (multi-select),
 * Experience Level (single-select), Availability (single-select).
 *
 * Fully controlled — this component holds no state and no hardcoded
 * application data. Option lists have sensible defaults so it also
 * renders standalone, but pass your real lists via props.
 *
 * Props:
 * - skillOptions          string[]
 * - experienceOptions     string[]
 * - availabilityOptions   string[]
 * - selectedSkills        string[]
 * - selectedExperience    string | null
 * - selectedAvailability  string | null
 * - onSkillsChange        (string[]) => void
 * - onExperienceChange    (string | null) => void
 * - onAvailabilityChange  (string | null) => void
 * - onClearAll            () => void   optional "clear filters" action
 */

const DEFAULT_SKILLS = [
  "React",
  "Node.js",
  "Python",
  "TypeScript",
  "Go",
  "Java",
  "ML / AI",
];
const DEFAULT_EXPERIENCE = ["Beginner", "Intermediate", "Advanced", "Expert"];
const DEFAULT_AVAILABILITY = ["Available", "Open to offers", "Not available"];

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

export default function DeveloperFilters({
  skillOptions = DEFAULT_SKILLS,
  experienceOptions = DEFAULT_EXPERIENCE,
  availabilityOptions = DEFAULT_AVAILABILITY,
  selectedSkills = [],
  selectedExperience = null,
  selectedAvailability = null,
  onSkillsChange,
  onExperienceChange,
  onAvailabilityChange,
  onClearAll,
}) {
  const toggleSkill = (skill) => {
    if (selectedSkills.includes(skill)) {
      onSkillsChange?.(selectedSkills.filter((s) => s !== skill));
    } else {
      onSkillsChange?.([...selectedSkills, skill]);
    }
  };

  const toggleSingle = (value, current, onChange) => {
    onChange?.(current === value ? null : value);
  };

  const hasActiveFilters =
    selectedSkills.length > 0 || selectedExperience || selectedAvailability;

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-5">
      <FilterGroup label="Skills">
        {skillOptions.map((skill) => (
          <button
            key={skill}
            type="button"
            onClick={() => toggleSkill(skill)}
            aria-pressed={selectedSkills.includes(skill)}
            className={chipClass(selectedSkills.includes(skill))}
          >
            {skill}
          </button>
        ))}
      </FilterGroup>

      <FilterGroup label="Experience Level">
        {experienceOptions.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => toggleSingle(level, selectedExperience, onExperienceChange)}
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