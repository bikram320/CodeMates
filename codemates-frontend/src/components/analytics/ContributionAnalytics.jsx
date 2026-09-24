import { Trophy } from "lucide-react";

import EmptyState from "../ui/EmptyState";
import { SERIES } from "./ActivityTimeline";

// Maps each series to the matching ContributionScoreResponse field.
const COUNT_FIELDS = { tasksCompleted: "tasksCompleted", commits: "commitsCount", messages: "messagesSent" };

export default function ContributionAnalytics({ contributions }) {
  const ranked = [...contributions].sort((a, b) => b.totalScore - a.totalScore);
  const teamTotal = ranked.reduce((sum, c) => sum + c.totalScore, 0);
  const topScore = ranked[0]?.totalScore ?? 0;

  return (
    <section
      aria-labelledby="contribution-analytics-title"
      className="rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5"
    >
      <h2 id="contribution-analytics-title" className="page-section-heading">
        Contribution breakdown
      </h2>
      <p className="mt-0.5 text-xs text-[#6B6890]">
        {ranked.length ? `Each member's share of the ${teamTotal} points earned so far` : "All-time contribution scores"}
      </p>

      {ranked.length === 0 ? (
        <EmptyState
          icon={Trophy}
          title="No contributions yet"
          description="Completed tasks, commits and messages count toward each member's score."
        />
      ) : (
        <ol className="mt-4 space-y-5">
          {ranked.map((c, i) => (
            <li key={c.userId}>
              <div className="flex items-baseline gap-2 text-sm">
                <span className="w-4 text-xs tabular-nums text-[#6B6890]">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-medium text-[#F5F5F5]">{c.name}</span>
                <span className="font-semibold tabular-nums text-[#F5F5F5]">{c.totalScore}</span>
                <span className="w-9 text-right text-xs tabular-nums text-[#6B6890]">
                  {teamTotal ? Math.round((c.totalScore / teamTotal) * 100) : 0}%
                </span>
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#1D1A40] sm:ml-6">
                <div
                  className="h-full rounded-full bg-[#6C7BFF]"
                  style={{ width: `${topScore ? (c.totalScore / topScore) * 100 : 0}%` }}
                />
              </div>

              <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8B86B8] sm:ml-6">
                {SERIES.map((s) => (
                  <span key={s.key} className="inline-flex items-center gap-1.5">
                    <span aria-hidden="true" className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                    <span className="tabular-nums text-[#A9A6C8]">{c[COUNT_FIELDS[s.key]]}</span> {s.label.toLowerCase()}
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}