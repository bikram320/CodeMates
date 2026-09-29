import { CheckCircle2, GitCommit, MessageSquare, TrendingUp } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Avatar from "../ui/Avatar";

/**
 * One member's contribution summary card.
 *
 * Props:
 * - rank                     number | undefined
 * - name, avatarUrl, role
 * - tasksCompleted, commitsCount, messagesSent, totalScore
 * - significanceProbability  0–1 | undefined — Model 3's prediction, only
 *   present after a leader runs "Predict significance"
 * - onClick                  optional — makes the card clickable (drilldown)
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
                                           significanceProbability,
                                           onClick,
                                           className = "",
                                         }) {
  return (
      <Card
          hoverable
          padding="md"
          onClick={onClick}
          className={`flex flex-col gap-4 ${onClick ? "cursor-pointer" : ""} ${className}`}
      >
        <div className="flex items-center gap-3">
          {typeof rank === "number" && (
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--cm-indigo-soft)] text-xs font-semibold text-[var(--cm-lavender)]">
            {rank}
          </span>
          )}
          <Avatar name={name} src={avatarUrl} size={40} />
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

        {/* Model 3 prediction — deliberately separate from totalScore above:
          this is a predictive signal from GitHub profile + repo context,
          not a measure of points already earned. Absent until a leader
          runs "Predict significance". */}
        {typeof significanceProbability === "number" && (
            <div className="flex items-center gap-1.5 rounded-md bg-[var(--cm-indigo-soft)] px-2.5 py-1.5 text-xs text-[var(--cm-lavender)]">
              <TrendingUp size={12} />
              {Math.round(significanceProbability * 100)}% predicted significant contributor
            </div>
        )}
      </Card>
  );
}