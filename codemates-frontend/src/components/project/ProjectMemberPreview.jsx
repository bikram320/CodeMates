import { Link } from "react-router-dom";
import Card from "../ui/Card";
import Avatar from "../ui/Avatar";
import Badge from "../ui/Badge";
import useUserDirectory from "../../hooks/useUserDirectory";

const ROLE_VARIANT = {
    LEADER: "soft",
    CONTRIBUTOR: "outline",
    REVIEWER: "neutral",
};

const ROLE_ORDER = { LEADER: 0, CONTRIBUTOR: 1, REVIEWER: 2 };

function shortId(userId) {
    return userId ? `${userId.slice(0, 8)}…` : "Unknown member";
}

function MemberTile({ member, profile }) {
    const name = profile?.fullName || profile?.username || shortId(member.userId);
    const username = profile?.username;

    const content = (
        <>
            {/* Image if it loads, otherwise the first letter of the username */}
            <Avatar name={username ?? ""} src={profile?.avatarUrl} size={40} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[var(--cm-text)]">{name}</p>
                {username && (
                    <p className="truncate text-xs text-[var(--cm-muted)]">@{username}</p>
                )}
            </div>
            <Badge variant={ROLE_VARIANT[member.role] ?? "neutral"}>{member.role}</Badge>
        </>
    );

    const tileClass =
        "flex items-center gap-3 rounded-md border border-[var(--cm-border)] p-3";

    return username ? (
        <Link
            to={`/discover/developers/${username}`}
            className={`${tileClass} transition-colors hover:bg-[var(--cm-indigo-soft)]`}
        >
            {content}
        </Link>
    ) : (
        <div className={tileClass}>{content}</div>
    );
}

/**
 * Team section of the project details page.
 *
 * getProjectMembers() only returns userIds, so names, usernames and avatars
 * are resolved in one batch request with useUserDirectory. While that loads
 * (or if it fails) a row falls back to a shortened id.
 *
 * Props:
 * - members   ProjectMemberResponseDto[]
 */
export default function ProjectMemberPreview({ members = [], className = "" }) {
    const { directory } = useUserDirectory(members.map((m) => m.userId));

    const sorted = [...members].sort(
        (a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)
    );

    return (
        <Card className={`flex flex-col gap-4 ${className}`}>
            <h2 className="page-section-heading" style={{ fontSize: "1.15rem" }}>
                Team ({members.length})
            </h2>

            {members.length === 0 ? (
                <p className="text-sm text-[var(--cm-text-dim)]">No members yet.</p>
            ) : (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {sorted.map((member) => (
                        <li key={member.id} className="min-w-0">
                            <MemberTile member={member} profile={directory[member.userId]} />
                        </li>
                    ))}
                </ul>
            )}
        </Card>
    );
}