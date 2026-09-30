import { Plus } from "lucide-react";
import SearchBar from "../ui/SearchBar";
import Button from "../ui/Button";

const TYPE_OPTIONS = [
  { value: "LINK", label: "Link" },
  { value: "DOCUMENT", label: "Document" },
  { value: "DESIGN", label: "Design" },
  { value: "OTHER", label: "Other" },
];

const selectClass =
    "rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface)] px-3 py-2 text-sm text-[var(--cm-text)] focus:border-[var(--cm-indigo)] focus:outline-none";

/**
 * Controls bar for the Resources page: search, "Add Resource" action,
 * and two filter dropdowns (resource type, uploaded by).
 *
 * Props:
 * - search             string
 * - onSearchChange     (string) => void
 * - selectedType       string | null
 * - onTypeChange       (string | null) => void
 * - selectedUploader   string | null   (a userId)
 * - onUploaderChange   (string | null) => void
 * - uploaderOptions    { value: userId, label: displayName }[]
 * - onAddClick         () => void
 */
export default function ResourceHeader({
                                         search,
                                         onSearchChange,
                                         selectedType,
                                         onTypeChange,
                                         selectedUploader,
                                         onUploaderChange,
                                         uploaderOptions = [],
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

        <div className="flex flex-wrap gap-3">
          <select
              value={selectedType ?? ""}
              onChange={(e) => onTypeChange(e.target.value || null)}
              aria-label="Filter by resource type"
              className={selectClass}
          >
            <option value="">All types</option>
            {TYPE_OPTIONS.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
            ))}
          </select>

          <select
              value={selectedUploader ?? ""}
              onChange={(e) => onUploaderChange(e.target.value || null)}
              aria-label="Filter by uploader"
              className={selectClass}
          >
            <option value="">All members</option>
            {uploaderOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
            ))}
          </select>
        </div>
      </div>
  );
}