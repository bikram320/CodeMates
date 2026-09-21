import { FolderOpen } from "lucide-react";
import ResourceCard from "./ResourceCard";
import EmptyState from "../ui/EmptyState";
import Button from "../ui/Button";

/**
 * Responsive grid of resource cards, or an empty state when there's
 * nothing to show (either no resources at all, or none matching the
 * current search/filter).
 *
 * Props:
 * - resources         already-enriched resource objects (see ResourceCard)
 * - hasActiveFilters  boolean — changes the empty state's copy/action
 * - onEdit, onDelete  (resource) => void
 * - onAddClick        () => void — used by the empty state's action
 * - onClearFilters    () => void
 */
export default function ResourceList({
  resources = [],
  hasActiveFilters = false,
  onEdit,
  onDelete,
  onAddClick,
  onClearFilters,
}) {
  if (resources.length === 0) {
    return hasActiveFilters ? (
      <EmptyState
        icon={FolderOpen}
        title="No resources found"
        description="Try adjusting your search or filter."
        action={
          <Button variant="outline" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={FolderOpen}
        title="No resources yet"
        description="Share a link to a doc, design file, or repo for the team."
        action={
          <Button variant="primary" onClick={onAddClick}>
            Add Resource
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          {...resource}
          onEdit={() => onEdit(resource)}
          onDelete={() => onDelete(resource)}
        />
      ))}
    </div>
  );
}