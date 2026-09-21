import { CheckCircle2, GitCommit, MessageSquare } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";

/**
 * One member's contribution summary card.
 *
 * Props:
 * - rank              number | undefined — shown as a small badge (1 = top contributor)
 * - name, avatarUrl, role
 * - tasksCompleted, commitsCount, messagesSent, totalScore
 */
export default function ContributionCard({
  rank,
  name,
  avatarUrl,
  role,
  tasksCompleted = 0,
  commitsCount = 0,
  messagesSent = 0,
  totalScore = 0,
  className = "",
}) {
  return (
    <Card hoverable padding="md" className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {typeof rank === "number" && (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--cm-indigo-soft)] text-xs font-semibold text-[var(--cm-lavender)]">
            {rank}
          </span>
        )}
        <img
          src={avatarUrl}
          alt={name}
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-[var(--cm-text)]">{name}</p>
          {role && <p className="truncate text-xs text-[var(--cm-muted)]">{role}</p>}
        </div>
        <Badge variant="soft" className="shrink-0">
          {totalScore} pts
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col items-center gap-1 rounded-md bg-[var(--cm-surface)] py-2">
          <CheckCircle2 size={14} className="text-[var(--cm-muted)]" />
          <span className="text-xs font-medium text-[var(--cm-text)]">{tasksCompleted}</span>
          <span className="text-[10px] text-[var(--cm-muted)]">Tasks</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-md bg-[var(--cm-surface)] py-2">
          <GitCommit size={14} className="text-[var(--cm-muted)]" />
          <span className="text-xs font-medium text-[var(--cm-text)]">{commitsCount}</span>
          <span className="text-[10px] text-[var(--cm-muted)]">Commits</span>
        </div>
        <div className="flex flex-col items-center gap-1 rounded-md bg-[var(--cm-surface)] py-2">
          <MessageSquare size={14} className="text-[var(--cm-muted)]" />
          <span className="text-xs font-medium text-[var(--cm-text)]">{messagesSent}</span>
          <span className="text-[10px] text-[var(--cm-muted)]">Messages</span>
        </div>
      </div>
    </Card>
  );
}