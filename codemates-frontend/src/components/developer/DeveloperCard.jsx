import { ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import SkillBadge from "./SkillBadge";

/**
 * Card summarizing one developer in the Discover Developers grid.
 *
 * Props match what DiscoverDevelopers.jsx's renderCard already sends:
 * - id, name, username, avatarUrl, bio, skills (string[]),
 *   experienceLevel, availability
 * - to             route string for "View Profile" (preferred)
 * - onViewProfile  fallback click handler, used only if `to` is absent
 *
 * avatarUrl isn't actually populated by the backend today (ProfileSearchResult
 * has no real photo field wired up yet), so the avatar is rendered via the
 * shared <Avatar /> component: real image if avatarUrl ever is present,
 * otherwise a colored circle with the developer's first initial — see
 * Avatar.jsx for how the color is chosen.
 */

// Visual weight for the availability pill — not new colors, just which
// existing Badge variant communicates "how available" at a glance.
const AVAILABILITY_VARIANT = {
    Available: "soft",
    "Open to offers": "outline",
    "Not available": "neutral",
};

export default function DeveloperCard({
                                          name,
                                          username,
                                          avatarUrl,
                                          bio,
                                          skills = [],
                                          experienceLevel,
                                          availability,
                                          to,
                                          onViewProfile,
                                          className = "",
                                      }) {
    return (
        <Card hoverable padding="md" className={`flex flex-col gap-4 ${className}`}>
            <div className="flex items-start gap-3">
                <Avatar
                    name={name}
                    username={username}
                    avatarUrl={avatarUrl}
                    className="h-12 w-12 text-sm"
                />
                <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-[var(--cm-text)]">
                        {name}
                    </h3>
                    <p className="truncate text-xs text-[var(--cm-muted)]">
                        @{username}
                    </p>
                </div>
            </div>

            {bio && (
                <p className="line-clamp-2 text-sm leading-relaxed text-[var(--cm-text-dim)]">
                    {bio}
                </p>
            )}

            {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                        <SkillBadge key={skill} skill={skill} />
                    ))}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
                {experienceLevel && <Badge variant="neutral">{experienceLevel}</Badge>}
                {availability && (
                    <Badge variant={AVAILABILITY_VARIANT[availability] ?? "neutral"}>
                        {availability}
                    </Badge>
                )}
            </div>

            <Button
                to={to}
                onClick={!to ? onViewProfile : undefined}
                variant="secondary"
                size="sm"
                rightIcon={ArrowRight}
                className="mt-auto self-start"
            >
                View Profile
            </Button>
        </Card>
    );
}