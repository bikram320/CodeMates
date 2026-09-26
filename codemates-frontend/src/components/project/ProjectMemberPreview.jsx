import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import useUserDirectory from "../../hooks/useUserDirectory";

const ROLE_VARIANT = {
    LEADER: "soft",
    CONTRIBUTOR: "outline",
    REVIEWER: "neutral",
};

/** Last-resort fallback for a userId that profile lookup couldn't resolve
 *  (e.g. the profile hasn't been created yet, or the lookup failed). */
function shortId(userId) {
    return userId ? `${userId.slice(0, 8)}…` : "Unknown member";
}

/**
 * Sidebar preview of project members.
 *
 * getProjectMembers() only returns { id, projectId, userId, role,
 * joinedAt, invitedByUserId } — no display name or avatar. This
 * component now resolves those userIds to real profiles via
 * useUserDirectory (GET /api/users/by-ids), and only falls back to a
 * shortened userId if a particular profile can't be found.
 *
 * Props:
 * - members   ProjectMemberResponseDto[]
 */
export default function ProjectMemberPreview({ members = [], className = "" }) {
    const userIds = members.map((m) => m.userId);
    const { directory, isLoading } = useUserDirectory(userIds);

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
                                <Badge variant={ROLE_VARIANT[member.role] ?? "neutral"}>
                                    {member.role}
                                </Badge>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Card>
    );
}