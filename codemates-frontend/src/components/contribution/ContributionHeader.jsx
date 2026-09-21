import ContributionStats from "./ContributionStats";

/**
 * Hero section for the Contributions page: title/description plus the
 * project-wide aggregate stat tiles (renders ContributionStats inside).
 *
 * Props:
 * - title        defaults to "Contributions"
 * - description  string
 * - stats        passed straight through to ContributionStats
 */
export default function ContributionHeader({
  title = "Contributions",
  description,
  stats = [],
  className = "",
}) {
  return (
    <div
      className={`flex flex-col gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6 ${className}`}
    >
      <div>
        <h1 className="text-xl font-semibold text-[var(--cm-text)]">{title}</h1>
        {description && (
          <p className="mt-1 max-w-xl text-sm text-[var(--cm-text-dim)]">
            {description}
          </p>
        )}
      </div>

      <ContributionStats stats={stats} />
    </div>
  );
}