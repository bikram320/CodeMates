import { Users, CalendarDays, Globe, Lock } from "lucide-react";
import Card from "../ui/Card";

function DetailRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center justify-between gap-3 text-sm">
      <span className="flex items-center gap-2 text-[var(--cm-text-dim)]">
        <Icon size={15} className="text-[var(--cm-muted)]" />
          {label}
      </span>
            <span className="font-medium text-[var(--cm-text)]">{value}</span>
        </div>
    );
}

function formatDate(value) {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/**
 * Sidebar card with the project's key facts.
 *
 * The task count + completion bar from the mock version are still dropped —
 * they need a task-service call that isn't wired on this page.
 *
 * Props:
 * - teamSize     { current, max }  — memberCount / maxMembers
 * - createdAt    ISO date string
 * - visibility   PUBLIC | PRIVATE
 */
export default function ProjectStats({ teamSize, createdAt, visibility, className = "" }) {
    const isPrivate = visibility === "PRIVATE";
    const pct =
        teamSize?.max > 0
            ? Math.min(100, Math.round((teamSize.current / teamSize.max) * 100))
            : null;

    return (
        <Card className={`flex flex-col gap-4 ${className}`}>
            <h2 className="page-section-heading" style={{ fontSize: "1.15rem" }}>
                Details
            </h2>

            {teamSize && (
                <div className="flex flex-col gap-2">
                    <DetailRow
                        icon={Users}
                        label="Team size"
                        value={`${teamSize.current}/${teamSize.max ?? "∞"}`}
                    />
                    {pct !== null && (
                        <div
                            className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--cm-indigo-soft)]"
                            role="progressbar"
                            aria-valuenow={pct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label="Team capacity"
                        >
                            <div
                                className="h-full rounded-full bg-[var(--cm-indigo)]"
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    )}
                </div>
            )}

            <DetailRow icon={CalendarDays} label="Created" value={formatDate(createdAt)} />

            {visibility && (
                <DetailRow
                    icon={isPrivate ? Lock : Globe}
                    label="Visibility"
                    value={isPrivate ? "Private" : "Public"}
                />
            )}
        </Card>
    );
}