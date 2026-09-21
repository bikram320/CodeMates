/**
 * Row of stat tiles. Generic and array-driven rather than hardcoded to
 * specific metrics, so ContributionHeader decides what to show.
 *
 * Props:
 * - stats  { label, value, icon?, note? }[] — `note` is used for the
 *          "simulated" disclaimer on the commits tile
 */
export default function ContributionStats({ stats = [] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="rounded-lg bg-[var(--cm-surface)] p-4"
            style={{ border: "1px solid #6c7bff" }}
          >
            <div
              className="flex items-center gap-1.5 text-xs"
              style={{ color: "#6c7bff" }}
            >
              {Icon && <Icon size={13} />}
              {stat.label}
            </div>
            <p className="mt-2 text-2xl font-semibold" style={{ color: "#6c7bff" }}>
              {stat.value}
            </p>
            {stat.note && (
              <p className="mt-1 text-[10px] leading-snug text-[var(--cm-muted)]">
                {stat.note}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}