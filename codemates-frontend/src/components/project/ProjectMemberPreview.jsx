import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
<<<<<<< Updated upstream
import Badge from "../ui/Badge";

const ROLE_VARIANT = {
  LEADER: "soft",
  CONTRIBUTOR: "outline",
  REVIEWER: "neutral",
};

=======
import { ROLE_META } from "../team/TeamMemberCard";
import useUserDirectory from "../../hooks/useUserDirectory";

/** Last-resort fallback for a userId that profile lookup couldn't resolve
 *  (e.g. the profile hasn't been created yet, or the lookup failed). */
>>>>>>> Stashed changes
function shortId(userId) {
  return userId ? `${userId.slice(0, 8)}…` : "Unknown member";
}

/**
 * Sidebar preview of project members.
 *
 * getProjectMembers() only returns { id, projectId, userId, role,
 * joinedAt, invitedByUserId } — no display name or avatar (that lives
 * in a user-service that isn't wired up on this page). So each row
 * shows the member's role and a shortened user id instead of a name,
 * and Avatar falls back to its "?" placeholder since there's no real
 * name yet to derive initials from. Swap `shortId(member.userId)` for
 * a real name once a user lookup is available.
 *
 * Role colors come from TeamMemberCard's ROLE_META so this preview and
 * the full Team page always stay visually in sync — edit ROLE_META once,
 * both places update.
 *
 * Props:
 * - members   ProjectMemberResponseDto[]
 */
export default function ProjectMemberPreview({ members = [], className = "" }) {
  return (
    <Card className={`flex flex-col gap-4 ${className}`}>
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]">
        Team ({members.length})
      </h2>

<<<<<<< Updated upstream
      {members.length === 0 ? (
        <p className="text-sm text-[var(--cm-text-dim)]">No members yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {members.map((member) => (
            <li key={member.id} className="flex items-center gap-3">
              <Avatar name="" size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-[var(--cm-text)]">
                  {shortId(member.userId)}
                </p>
              </div>
              <Badge variant={ROLE_VARIANT[member.role] ?? "neutral"}>
                {member.role}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
=======
    return (
        <Card className={`flex flex-col gap-4 ${className}`}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]">
                Team ({members.length})
            </h2>

            {members.length === 0 ? (
                <p className="text-sm text-[var(--cm-text-dim)]">No members yet.</p>
            ) : (
                <ul className="flex flex-col gap-3">
                    {members.map((member) => {
                        const profile = directory[member.userId];
                        const displayName =
                            profile?.fullName || profile?.username || shortId(member.userId);
                        const roleMeta = ROLE_META[member.role] ?? ROLE_META.CONTRIBUTOR;

                        return (
                            <li key={member.id} className="flex items-center gap-3">
                                <Avatar name={displayName} size={32} />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm text-[var(--cm-text)]">
                                        {isLoading && !profile ? (
                                            <span className="inline-block h-3 w-24 animate-pulse rounded bg-[var(--cm-border)]" />
                                        ) : (
                                            displayName
                                        )}
                                    </p>
                                </div>
                                <span
                                    className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${roleMeta.badge}`}
                                >
                                    {roleMeta.label}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
>>>>>>> Stashed changes
}