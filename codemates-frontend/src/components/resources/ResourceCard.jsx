import { ExternalLink, FileText, Trash2 } from "lucide-react";
import Button from "../ui/Button";

const TYPE_LABELS = {
  LINK: "Link",
  DOCUMENT: "Document",
  DESIGN: "Design",
  OTHER: "Other",
};

function formatDate(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/**
 * The backend has no update/edit endpoint for resources (only add,
 * list, and delete — see ProjectResourceController), so this card only
 * exposes delete. `addedBy` isn't available either: ResourceResponse
 * only carries uploadedByUserId, and the real member endpoint doesn't
 * return a display name, so the card shows the created date instead.
 */
export default function ResourceCard({
  name,
  url,
  description,
  resourceType,
  createdAt,
  isDeleting = false,
  onDelete,
}) {
  const dateLabel = formatDate(createdAt);

  return (
    <article className="flex min-h-52 flex-col gap-4 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--cm-indigo-soft)] text-[var(--cm-lavender)]">
            <FileText size={18} />
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-[var(--cm-text)]">{name}</h3>
            <p className="text-xs text-[var(--cm-muted)]">{TYPE_LABELS[resourceType] ?? resourceType}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          aria-label="Delete resource"
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--cm-muted)] transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <p className="line-clamp-3 flex-1 text-sm text-[var(--cm-text-dim)]">{description || "No description provided."}</p>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--cm-border)] pt-3">
        <span className="truncate text-xs text-[var(--cm-muted)]">{dateLabel ? `Added ${dateLabel}` : ""}</span>
        <Button href={url} variant="ghost" size="sm" rightIcon={ExternalLink}>
          Open
        </Button>
      </div>
    </article>
  );
}