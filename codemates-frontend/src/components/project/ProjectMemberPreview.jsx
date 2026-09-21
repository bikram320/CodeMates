import { CheckCircle2, ListTodo, Users } from "lucide-react";
import Card from "../ui/Card";

function StatRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-2 text-[var(--cm-text-dim)]">
        <Icon size={15} className="text-[var(--cm-muted)]" />
        {label}
      </span>
      <span className="font-medium text-[var(--cm-text)]">{value}</span>
    </div>
  );
}

/**
 * Sidebar card showing team size, task counts, and a completion bar.
 *
 * Props:
 * - teamSize   { current, max }
 * - tasks      { total, completed }
 */
export default function ProjectStats({ teamSize, tasks, className = "" }) {
  const completionPct =
    tasks && tasks.total > 0
      ? Math.round((tasks.completed / tasks.total) * 100)
      : 0;

  return (
    <Card className={`flex flex-col gap-4 ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]">
        Project Stats
      </h2>

      {teamSize && (
        <StatRow
          icon={Users}
          label="Team size"
          value={`${teamSize.current}/${teamSize.max}`}
        />
      )}

      {tasks && (
        <>
          <StatRow
            icon={ListTodo}
            label="Tasks"
            value={`${tasks.completed}/${tasks.total}`}
          />

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-[var(--cm-muted)]">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} />
                Progress
              </span>
              <span>{completionPct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--cm-surface)]">
              <div
                className="h-full rounded-full bg-[var(--cm-indigo)] transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  );
}