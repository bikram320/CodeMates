import { useState } from "react";
import { Activity, CheckCircle2, GitCommitHorizontal, MessageSquare } from "lucide-react";

import EmptyState from "../ui/EmptyState";
import { formatRelativeTime } from "../notifications/NotificationItem";

const card = "rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5";

/** Series shared with ContributionAnalytics so colors mean the same thing on the page. */
export const SERIES = [
    { key: "tasksCompleted", label: "Tasks", singular: "task", plural: "tasks", color: "#6C7BFF" },
    { key: "commits", label: "Commits", singular: "commit", plural: "commits", color: "#C9A8FF" },
    { key: "messages", label: "Messages", singular: "message", plural: "messages", color: "#5D5A8F" },
];

const EVENT_META = {
    TASK_COMPLETED: { verb: "completed a task", icon: CheckCircle2, color: "#5FD3A0" },
    COMMIT: { verb: "pushed commits", icon: GitCommitHorizontal, color: "#C9A8FF" },
    MESSAGE_SENT: { verb: "sent a message", icon: MessageSquare, color: "#8B86B8" },
};
const FALLBACK_EVENT = { icon: Activity, color: "#8B86B8" };

const parseDay = (dateString) => new Date(`${dateString}T00:00:00`);
const dayNumber = (dateString) => parseDay(dateString).getDate();
const weekdayShort = (dateString) => parseDay(dateString).toLocaleDateString("en-US", { weekday: "short" });
const fullDay = (dateString) =>
    parseDay(dateString).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const count = (n, series) => `${n} ${n === 1 ? series.singular : series.plural}`;

/** Round the top of the y-axis up to an even number so the 3 ticks (0, half, max) are whole numbers. */
const niceMax = (max) => (max <= 2 ? 2 : max % 2 === 0 ? max : max + 1);

function TrendChart({ trend }) {
    const [activeDate, setActiveDate] = useState(null);

    const totalOf = (d) => SERIES.reduce((sum, s) => sum + d[s.key], 0);
    const grandTotal = trend.reduce((sum, d) => sum + totalOf(d), 0);
    const peak = Math.max(...trend.map(totalOf), 0);
    const busiest = trend.find((d) => totalOf(d) === peak);
    const axisMax = niceMax(Math.max(peak, 1));
    const ticks = [0, axisMax / 2, axisMax];
    const activeDays = trend.filter((d) => totalOf(d) > 0).length;
    const todayKey = trend[trend.length - 1]?.date;

    const active = trend.find((d) => d.date === activeDate);

    return (
        <>
            {/* How to read it */}
            <p className="mt-3 text-xs leading-relaxed text-[#8B86B8]">
                Each bar is one day. Its height is the total number of actions that day, and its colors show what kind of
                actions they were.
            </p>

            {/* Legend with period totals */}
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#A9A6C8]">
                {SERIES.map((s) => {
                    const sum = trend.reduce((acc, d) => acc + d[s.key], 0);
                    return (
                        <li key={s.key} className="inline-flex items-center gap-1.5">
                            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                            {s.label}
                            <span className="tabular-nums text-[#F5F5F5]">{sum}</span>
                        </li>
                    );
                })}
            </ul>

            {/* Hover / focus readout — always reserves its height so the chart doesn't jump */}
            <div
                className={`mt-3 min-h-[2.5rem] rounded-lg bg-[#13112B] px-3 py-2 text-xs text-white`}
                aria-live="polite"
            >
                {active ? (
                    <>
                        <span className="font-semibold text-white">{fullDay(active.date)}</span>
                        <span className="text-white"> · </span>
                        <span className="font-semibold tabular-nums text-white">{totalOf(active)}</span> total:{" "}
                        {SERIES.map((s) => count(active[s.key], s)).join(", ")}
                    </>
                ) : (
                    <>
                        {grandTotal} actions in 14 days across {activeDays} active {activeDays === 1 ? "day" : "days"}.
                        {busiest && peak > 0 && (
                            <>
                                {" "}
                                Busiest day: <span className="font-semibold text-white">{fullDay(busiest.date)}</span> ({peak}).
                            </>
                        )}{" "}
                        <span className="text-white">Hover or tap a bar for details.</span>
                    </>
                )}
            </div>

            {/* Chart */}
            <div
                role="img"
                aria-label={`Daily activity over the last ${trend.length} days: ${grandTotal} actions in total, busiest day ${
                    busiest ? fullDay(busiest.date) : "none"
                } with ${peak}`}
                className="mt-4 flex gap-2"
            >
                {/* Y axis */}
                <div className="relative h-44 w-6 shrink-0" aria-hidden="true">
                    {ticks.map((t) => (
                        <span
                            key={t}
                            className="absolute right-0 translate-y-1/2 text-[10px] tabular-nums leading-none text-[#6B6890]"
                            style={{ bottom: `${(t / axisMax) * 100}%` }}
                        >
              {t}
            </span>
                    ))}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="relative h-44 border-b border-[#2E2A66]">
                        {/* Gridlines */}
                        {ticks.slice(1).map((t) => (
                            <div
                                key={t}
                                aria-hidden="true"
                                className="absolute inset-x-0 border-t border-dashed border-[#1C1A38]"
                                style={{ bottom: `${(t / axisMax) * 100}%` }}
                            />
                        ))}

                        {/* Bars */}
                        <div className="absolute inset-0 flex items-end gap-1.5">
                            {trend.map((d) => {
                                const total = totalOf(d);
                                const pct = (total / axisMax) * 100;
                                const isActive = activeDate === d.date;
                                return (
                                    <div
                                        key={d.date}
                                        tabIndex={0}
                                        onMouseEnter={() => setActiveDate(d.date)}
                                        onMouseLeave={() => setActiveDate(null)}
                                        onFocus={() => setActiveDate(d.date)}
                                        onBlur={() => setActiveDate(null)}
                                        onClick={() => setActiveDate(isActive ? null : d.date)}
                                        title={`${fullDay(d.date)}: ${SERIES.map((s) => count(d[s.key], s)).join(", ")}`}
                                        className="relative h-full flex-1 cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                                    >
                                        {total > 0 && (
                                            <>
                        <span
                            aria-hidden="true"
                            className="absolute inset-x-0 mb-0.5 text-center text-[10px] font-medium tabular-nums leading-none text-[#F5F5F5]"
                            style={{ bottom: `${pct}%` }}
                        >
                          {total}
                        </span>
                                                <div
                                                    className={`absolute inset-x-0 bottom-0 flex flex-col-reverse overflow-hidden rounded-t transition-opacity ${
                                                        activeDate && !isActive ? "opacity-50" : ""
                                                    }`}
                                                    style={{ height: `${pct}%` }}
                                                >
                                                    {SERIES.map((s) => (
                                                        <div
                                                            key={s.key}
                                                            style={{ height: `${(d[s.key] / total) * 100}%`, backgroundColor: s.color }}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* X axis: weekday + day of month */}
                    <div aria-hidden="true" className="mt-1.5 flex gap-1.5">
                        {trend.map((d, i) => (
                            <span
                                key={d.date}
                                className={`flex-1 text-center leading-tight ${i % 2 ? "invisible sm:visible" : ""}`}
                            >
                <span
                    className={`block text-[10px] tabular-nums ${
                        d.date === todayKey ? "font-semibold text-[#F5F5F5]" : "text-[#8B86B8]"
                    }`}
                >
                  {dayNumber(d.date)}
                </span>
                <span className="hidden text-[9px] text-[#6B6890] sm:block">
                  {d.date === todayKey ? "Today" : weekdayShort(d.date).slice(0, 3)}
                </span>
              </span>
                        ))}
                    </div>
                </div>
            </div>

            <p className="mt-2 text-center text-[10px] text-[#6B6890]">Day of month · left axis shows actions per day</p>
        </>
    );
}

export default function ActivityTimeline({ trend, activity }) {
    const hasTrend = trend.some((d) => d.tasksCompleted + d.commits + d.messages > 0);

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
            <section aria-labelledby="activity-trend-title" className={card}>
                <h2 id="activity-trend-title" className="text-sm font-semibold text-[#F5F5F5]">
                    Daily activity
                </h2>
                <p className="mt-0.5 text-xs text-[#6B6890]">
                    Tasks completed, commits and messages per day, last 14 days
                </p>
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
                      <span className="font-medium text-[#F5F5F5]">
                        {event.userName ?? `User ${event.userId?.slice(0, 8) ?? "?"}`}
                      </span>{" "}
                                            {verb}
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