import { Users } from "lucide-react";

import EmptyState from "../ui/EmptyState";
import { formatRelativeTime } from "../notifications/NotificationItem";

const initials = (name) =>
  name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const METRICS = [
  { key: "tasksCompleted", label: "tasks" },
  { key: "commits", label: "commits" },
  { key: "messages", label: "msgs" },
];

export default function TeamActivity({ members }) {
  return (
    <section aria-labelledby="team-activity-title" className="rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5">
      <h2 id="team-activity-title" className="page-section-heading">
        Team activity
      </h2>
      <p className="mt-0.5 text-xs text-[#6B6890]">What each member did in the last 7 days</p>

      {members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team activity yet"
          description="Invite developers to the project and their activity will show up here."
        />
      ) : (
        <ul className="mt-3 divide-y divide-[#1C1A38]">
          {members.map((m) => (
            <li key={m.userId} className="flex items-center gap-3 py-3">
              <div
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1D1A40] text-xs font-semibold text-[#C9A8FF]"
              >
                {initials(m.name)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#F5F5F5]">{m.name}</p>
                <p className="truncate text-xs text-[#6B6890]">
                  {m.role} · active {formatRelativeTime(m.lastActiveAt)}
                </p>
              </div>

              <dl className="grid shrink-0 grid-cols-3 gap-2 text-center sm:gap-4">
                {METRICS.map(({ key, label }) => (
                  <div key={key} className="w-10 sm:w-12">
                    <dd
                      className={`text-sm font-semibold tabular-nums ${
                        m.weekly[key] > 0 ? "text-[#F5F5F5]" : "text-[#6B6890]"
                      }`}
                    >
                      {m.weekly[key]}
                    </dd>
                    <dt className="text-[10px] text-[#6B6890]">{label}</dt>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}