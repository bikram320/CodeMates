import { ListChecks } from "lucide-react";

import EmptyState from "../ui/EmptyState";

const STATUS_COLORS = {
  todo: "#3A3670",
  in_progress: "#6C7BFF",
  review: "#C9A8FF",
  done: "#5FD3A0",
};

const R = 52;
const CIRC = 2 * Math.PI * R;

function StatusDonut({ segments, total }) {
  let offset = 0;
  return (
    <div className="relative h-40 w-40 shrink-0">
      <svg
        viewBox="0 0 140 140"
        role="img"
        aria-label={`Tasks by status: ${segments.map((s) => `${s.label} ${s.count}`).join(", ")}`}
        className="h-full w-full -rotate-90"
      >
        <circle cx="70" cy="70" r={R} fill="none" stroke="#1D1A40" strokeWidth="16" />
        {segments.map((s) => {
          const len = (s.count / total) * CIRC;
          const circle = (
            <circle
              key={s.id}
              cx="70"
              cy="70"
              r={R}
              fill="none"
              stroke={STATUS_COLORS[s.id] ?? "#6C7BFF"}
              strokeWidth="16"
              strokeDasharray={`${len} ${CIRC - len}`}
              strokeDashoffset={-offset}
            />
          );
          offset += len;
          return circle;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums text-[#F5F5F5]">{total}</span>
        <span className="text-xs text-[#8B86B8]">tasks</span>
      </div>
    </div>
  );
}

export default function TaskAnalytics({ tasks }) {
  const total = tasks.byStatus.reduce((sum, s) => sum + s.count, 0);

  return (
    <section aria-labelledby="task-analytics-title" className="rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5">
      <h2 id="task-analytics-title" className="text-sm font-semibold text-[#F5F5F5]">
        Task breakdown
      </h2>
      <p className="mt-0.5 text-xs text-[#6B6890]">Where work stands on the board, and by priority</p>

      {total === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No tasks yet"
          description="Create tasks on the board to see how work is progressing."
        />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* By status */}
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <StatusDonut segments={tasks.byStatus} total={total} />
            <ul className="w-full space-y-2.5">
              {tasks.byStatus.map((s) => (
                <li key={s.id} className="flex items-center gap-2.5 text-sm">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: STATUS_COLORS[s.id] }}
                  />
                  <span className="flex-1 text-[#A9A6C8]">{s.label}</span>
                  <span className="font-medium tabular-nums text-[#F5F5F5]">{s.count}</span>
                  <span className="w-10 text-right text-xs tabular-nums text-[#6B6890]">
                    {Math.round((s.count / total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* By priority */}
          <div>
            <h3 className="mb-3 text-xs font-medium text-[#8B86B8]">Completed by priority</h3>
            <ul className="space-y-4">
              {tasks.byPriority.map((p) => (
                <li key={p.id}>
                  <div className="mb-1.5 flex items-baseline justify-between text-sm">
                    <span className="text-[#A9A6C8]">{p.label}</span>
                    <span className="text-xs tabular-nums text-[#8B86B8]">
                      {p.done} of {p.total} done
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#1D1A40]">
                    <div
                      className="h-full rounded-full bg-[#6C7BFF]"
                      style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}