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
                {/* Shows the image if it loads, otherwise the first letter of the username */}
                <Avatar name={username} src={avatarUrl} size={48} />
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