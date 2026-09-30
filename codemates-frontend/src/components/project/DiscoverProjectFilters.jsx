const PROJECT_TYPES = ["Open Source", "Academic", "Hackathon", "Startup", "Side Project"];
const AVAILABILITY = ["Recruiting", "In Progress", "Completed"];

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

export default function DiscoverProjectFilters({
                                                   selectedTech = [],
                                                   selectedType = null,
                                                   selectedAvailability = null,
                                                   onTechChange,
                                                   onTypeChange,
                                                   onAvailabilityChange,
                                                   onClearAll,
                                               }) {
    const toggleTech = (tech) => {
        onTechChange?.(
            selectedTech.includes(tech)
                ? selectedTech.filter((item) => item !== tech)
                : [...selectedTech, tech]
        );
    };

    const toggleSingle = (value, current, onChange) => {
        onChange?.(current === value ? null : value);
    };

    const hasActiveFilters =
        selectedTech.length > 0 || selectedType || selectedAvailability;

    return (
        <div className="flex flex-col gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-5">
            <FilterGroup label="Skills">
                {["React", "Node.js", "Python", "TypeScript", "Go", "Java", "ML / AI"].map((tech) => (
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
                {PROJECT_TYPES.map((type) => (
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

            <FilterGroup label="Availability">
                {AVAILABILITY.map((status) => (
                    <button
                        key={status}
                        type="button"
                        onClick={() => toggleSingle(status, selectedAvailability, onAvailabilityChange)}
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