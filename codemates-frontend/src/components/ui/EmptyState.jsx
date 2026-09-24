/**
 * Centered "nothing here" block. Use for empty search results, empty
 * lists, or a page with no data yet.
 *
 * Props:
 * - icon         Lucide icon component
 * - title        string
 * - description  string
 * - action       optional node (e.g. a <Button>)
 */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action = null,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 border-y border-dashed border-[var(--cm-border)] px-6 py-10 text-center ${className}`}
    >
      {Icon && (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--cm-indigo-soft)] text-[var(--cm-lavender)]">
          <Icon size={18} />
        </span>
      )}
      <h3 className="text-base font-medium text-[var(--cm-text)]">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-[var(--cm-text-dim)]">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}