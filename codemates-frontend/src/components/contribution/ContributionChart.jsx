/**
 * Contribution activity over time, as a plain inline SVG bar chart — no
 * charting library added, per the project's "no unnecessary dependencies"
 * rule. Colors use inline `style` rather than Tailwind/presentation
 * attributes so the CSS custom properties resolve reliably in SVG.
 *
 * Props:
 * - data  { date: "YYYY-MM-DD", points: number }[]  ascending by date —
 *         build this by aggregating ContributionEventResponse[] by day
 *         (see ProjectContributions.jsx's aggregateEventsByDay), the same
 *         way a real integration would derive a timeline from the events
 *         endpoint, since there's no dedicated timeline endpoint.
 */
function formatShortDate(isoDate) {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default function ContributionChart({ data = [], className = "" }) {
  if (data.length === 0) return null;

  const width = 700;
  const height = 220;
  const padding = 32;
  const max = Math.max(...data.map((d) => d.points), 1);
  const slot = (width - padding * 2) / data.length;
  const barWidth = Math.max(slot - 10, 4);

  return (
    <div
      className={`rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-5 ${className}`}
    >
      <h2 className="mb-4 text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]">
        Activity Over Time
      </h2>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-48 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Contribution points per day"
      >
        {data.map((d, i) => {
          const barHeight = (d.points / max) * (height - padding * 2);
          const x = padding + i * slot + (slot - barWidth) / 2;
          const y = height - padding - barHeight;

          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 2)}
                rx={3}
                style={{ fill: "#6c7bff" }}
              />
              <text
                x={x + barWidth / 2}
                y={height - padding + 16}
                textAnchor="middle"
                fontSize="9"
                style={{ fill: "var(--cm-muted)" }}
              >
                {formatShortDate(d.date)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}