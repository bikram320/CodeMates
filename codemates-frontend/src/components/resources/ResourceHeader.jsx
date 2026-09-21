import { Plus } from "lucide-react";
import SearchBar from "../ui/SearchBar";
import Button from "../ui/Button";

const TYPE_OPTIONS = [
  { value: "LINK", label: "Link" },
  { value: "DOCUMENT", label: "Document" },
  { value: "DESIGN", label: "Design" },
  { value: "OTHER", label: "Other" },
];

function chipClass(active) {
  return `rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
    active
      ? "border-[var(--cm-indigo)] bg-[var(--cm-indigo-soft)] text-[var(--cm-lavender)]"
      : "border-[var(--cm-border)] text-[var(--cm-text-dim)] hover:border-[var(--cm-border-strong)] hover:text-[var(--cm-text)]"
  }`;
}

/**
 * Controls bar for the Resources page: search, resource-type filter
 * chips, and the "Add Resource" action.
 *
 * Props:
 * - search            string
 * - onSearchChange    (string) => void
 * - selectedType      string | null
 * - onTypeChange      (string | null) => void
 * - onAddClick        () => void
 */
export default function ResourceHeader({
  search,
  onSearchChange,
  selectedType,
  onTypeChange,
  onAddClick,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={onSearchChange}
          placeholder="Search resources..."
          className="sm:flex-1"
        />
        <Button
          variant="primary"
          leftIcon={Plus}
          onClick={onAddClick}
          className="shrink-0"
        >
          Add Resource
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TYPE_OPTIONS.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() =>
              onTypeChange(selectedType === type.value ? null : type.value)
            }
            aria-pressed={selectedType === type.value}
            className={chipClass(selectedType === type.value)}
          >
            {type.label}
          </button>
        ))}
      </div>
    </div>
  );
}