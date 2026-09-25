import { Activity, CheckCircle2, GitCommitHorizontal, MessageSquare } from "lucide-react";

import EmptyState from "../ui/EmptyState";
import { formatRelativeTime } from "../notifications/NotificationItem";

const card = "rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5";

/** Series shared with ContributionAnalytics so colors mean the same thing on the page. */
export const SERIES = [
  { key: "tasksCompleted", label: "Tasks", color: "#6C7BFF" },
  { key: "commits", label: "Commits", color: "#C9A8FF" },
  { key: "messages", label: "Messages", color: "#5D5A8F" },
];

// ContributionEventResponse.eventType is a free string, not a closed enum —
// these three are the ones actually seen in use (matches ProjectContributions.jsx's
// own EVENT_TYPE_LABEL), with a generic fallback for anything else the backend
// emits (e.g. a future TASK_REVIEWED or FILE_SHARED, given ContributionScoreResponse
// already tracks tasksReviewed/filesShared even though no event type for them
// has been confirmed yet).
const EVENT_META = {
  TASK_COMPLETED: { verb: "completed a task", icon: CheckCircle2, color: "#5FD3A0" },
  COMMIT: { verb: "pushed commits", icon: GitCommitHorizontal, color: "#C9A8FF" },
  MESSAGE_SENT: { verb: "sent a message", icon: MessageSquare, color: "#8B86B8" },
};
const FALLBACK_EVENT = { icon: Activity, color: "#8B86B8" };

/** Matches the fallback in useProjectAnalytics.js's shortUserLabel — no name/avatar exists for a bare userId yet. */
const shortUserLabel = (userId) => `User ${userId?.slice(0, 8) ?? "?"}`;

const dayNumber = (dateString) => new Date(`${dateString}T00:00:00`).getDate();
const fullDay = (dateString) =>
  new Date(`${dateString}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });


function TrendChart({ trend }) {
  const totalOf = (d) => SERIES.reduce((sum, s) => sum + d[s.key], 0);
  const max = Math.max(...trend.map(totalOf), 1);

  return (
    <>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#A9A6C8]">
        {SERIES.map((s) => (
          <li key={s.key} className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
            {s.label}
          </li>
        ))}
      </ul>

      <div
        role="img"
        aria-label={`Daily activity over the last ${trend.length} days: ${trend.reduce((s, d) => s + totalOf(d), 0)} events in total`}
        className="mt-4 flex h-44 items-end gap-1.5 border-b border-[#1C1A38]"
      >
        {trend.map((d) => {
          const total = totalOf(d);
          return (
            <div
              key={d.date}
              className="flex h-full flex-1 flex-col justify-end"
              title={`${fullDay(d.date)}: ${d.tasksCompleted} tasks, ${d.commits} commits, ${d.messages} messages`}
            >
              <div
                className="flex flex-col-reverse overflow-hidden rounded-t"
                style={{ height: `${(total / max) * 100}%` }}
              >
                {SERIES.map((s) => (
                  <div
                    key={s.key}
                    style={{ height: total ? `${(d[s.key] / total) * 100}%` : 0, backgroundColor: s.color }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div aria-hidden="true" className="mt-1.5 flex gap-1.5">
        {trend.map((d, i) => (
          <span
            key={d.date}
            className={`flex-1 text-center text-[10px] tabular-nums text-[#6B6890] ${i % 2 ? "invisible sm:visible" : ""}`}
          >
            {dayNumber(d.date)}
          </span>
        ))}
      </div>
    </>
  );
}

export default function ActivityTimeline({ trend, activity }) {
  const hasTrend = trend.some((d) => d.tasksCompleted + d.commits + d.messages > 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
      <section aria-labelledby="activity-trend-title" className={card}>
        <h2 id="activity-trend-title" className="text-sm font-semibold text-[#F5F5F5]">
          Activity trend
        </h2>
        <p className="mt-0.5 text-xs text-[#6B6890]">Tasks completed, commits and messages per day, last 14 days</p>
        {hasTrend ? (
          <TrendChart trend={trend} />
        ) : (
          <EmptyState
            icon={Activity}
            title="No activity to chart"
            description="Once your team completes tasks, pushes commits or chats, daily activity appears here."
          />
        )}
      </section>

      <section aria-labelledby="recent-activity-title" className={card}>
        <h2 id="recent-activity-title" className="text-sm font-semibold text-[#F5F5F5]">
          Recent activity
        </h2>
        {activity.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Nothing yet"
            description="Project updates will be listed here as they happen."
          />
        ) : (
          <ul className="mt-3 divide-y divide-[#1C1A38]">
            {activity.map((event) => {
              const meta = EVENT_META[event.eventType] ?? FALLBACK_EVENT;
              const { icon: Icon, color } = meta;
              const verb = meta.verb ?? event.eventType?.toLowerCase().replaceAll("_", " ");
              return (
                <li key={event.id} className="flex items-start gap-3 py-3">
                  <span
                    aria-hidden="true"
                    className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${color}1A`, color }}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm leading-snug text-[#A9A6C8]">
                      <span className="font-medium text-[#F5F5F5]">{shortUserLabel(event.userId)}</span> {verb}
                      {event.description ? <> — {event.description}</> : null}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6B6890]">{formatRelativeTime(event.createdAt)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}