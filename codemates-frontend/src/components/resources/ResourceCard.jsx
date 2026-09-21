import { ExternalLink, FileText, MoreVertical } from "lucide-react";
import Button from "../ui/Button";

const TYPE_LABELS = {
  LINK: "Link",
  DOCUMENT: "Document",
  DESIGN: "Design",
  OTHER: "Other",
};

export default function ResourceCard({
  name,
  url,
  description,
  resourceType,
  addedBy,
  onEdit,
  onDelete,
}) {
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
        <details className="relative shrink-0">
          <summary className="flex h-7 w-7 cursor-pointer list-none items-center justify-center rounded-md text-[var(--cm-muted)] hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]">
            <MoreVertical size={16} />
          </summary>
          <div className="absolute right-0 z-10 mt-1 flex min-w-28 flex-col rounded-md border border-[var(--cm-border)] bg-[var(--cm-surface)] p-1 shadow-lg">
            <button type="button" className="rounded px-2 py-1.5 text-left text-xs text-[var(--cm-text)] hover:bg-[var(--cm-surface-2)]" onClick={onEdit}>
              Edit
            </button>
            <button type="button" className="rounded px-2 py-1.5 text-left text-xs text-red-300 hover:bg-[var(--cm-surface-2)]" onClick={onDelete}>
              Delete
            </button>
          </div>
        </details>
      </div>

      <p className="line-clamp-3 flex-1 text-sm text-[var(--cm-text-dim)]">{description || "No description provided."}</p>

      <div className="flex items-center justify-between gap-3 border-t border-[var(--cm-border)] pt-3">
        <span className="truncate text-xs text-[var(--cm-muted)]">{addedBy?.name ?? "Added by team"}</span>
        <Button href={url} variant="ghost" size="sm" rightIcon={ExternalLink}>
          Open
        </Button>
      </div>
    </article>
  );
}