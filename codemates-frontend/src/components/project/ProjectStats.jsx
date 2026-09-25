import { Users } from "lucide-react";
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
 * Sidebar card showing team size.
 *
 * The mock version also showed a task count + completion bar, but that
 * comes from a separate task-service endpoint not covered by
 * projectApi.js, so it's been dropped rather than faked. Wire it back
 * in once a task-summary call is available for this page.
 *
 * Props:
 * - teamSize   { current, max }  — from ProjectResponse's memberCount/maxMembers
 */
export default function ProjectStats({ teamSize, className = "" }) {
  return (
    <Card className={`flex flex-col gap-4 ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]">
        Project Stats
      </h2>

      {teamSize && (
        <StatRow
          icon={Users}
          label="Team size"
          value={`${teamSize.current}/${teamSize.max ?? "∞"}`}
        />
      )}
    </Card>
  );
}