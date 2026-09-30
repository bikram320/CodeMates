import ContributionStats from "./ContributionStats";

/**
 * Hero section for the Contributions page: title/description plus the
 * project-wide aggregate stat tiles (renders ContributionStats inside).
 *
 * Props:
 * - title        defaults to "Contributions"
 * - description  string
 * - stats        passed straight through to ContributionStats
 * - action       optional node, right-aligned in the top corner —
 *                e.g. the "Predict significance" button
 */
export default function ContributionHeader({
                                             title = "Contributions",
                                             description,
                                             stats = [],
                                             action,
                                             className = "",
                                           }) {
  return (
      <div
          className={`flex flex-col gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6 ${className}`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-[var(--cm-text)]">{title}</h1>
            {description && (
                <p className="mt-1 max-w-xl text-sm text-[var(--cm-text-dim)]">
                  {description}
                </p>
            )}
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </div>

        <ContributionStats stats={stats} />
      </div>
  );
}