import { ArrowRight } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import SkillBadge from "./SkillBadge";

<<<<<<< Updated upstream
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
        <img
          src={avatarUrl}
          alt={name}
          className="h-12 w-12 shrink-0 rounded-full object-cover"
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
=======
// Same green / yellow pills as ConnectionCard's availability status.
const AVAILABILITY_CLASS = {
    Available: "bg-[#10B981]/10 text-[#10B981]",
    "Open to offers": "bg-[#10B981]/10 text-[#10B981]",
    "Not available": "bg-[#F59E0B]/10 text-[#F59E0B]",
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
        <Card hoverable padding="md" className={`flex flex-col gap-3 ${className}`}>
            {/* Header: avatar + name on the left, View Profile top right */}
            <div className="flex items-center gap-3">
                <Avatar
                    name={name}
                    username={username}
                    avatarUrl={avatarUrl}
                    className="h-9 w-9 text-sm"
                />
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-[var(--cm-text)]">
                        {name}
                    </h3>
                    <p className="truncate text-xs text-[var(--cm-muted)]">
                        @{username}
                    </p>
                </div>

                <Button
                    to={to}
                    onClick={!to ? onViewProfile : undefined}
                    variant="secondary"
                    size="sm"
                    rightIcon={ArrowRight}
                    className="shrink-0 cursor-pointer gap-1.5 !bg-[#6366F1] text-white hover:!bg-[#4F46E5]"
                >
                    View Profile
                </Button>
            </div>

            {/* Experience level + availability */}
            {(experienceLevel || availability) && (
                <div className="flex items-center gap-2">
                    {experienceLevel && (
                        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cm-text-dim)]">
                            {experienceLevel}
                        </span>
                    )}
                    {availability && (
                        <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                AVAILABILITY_CLASS[availability] ?? "bg-[#F59E0B]/10 text-[#F59E0B]"
                            }`}
                        >
                            {availability}
                        </span>
                    )}
                </div>
            )}

            {/* Skills */}
            {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                        <SkillBadge key={skill} skill={skill} />
                    ))}
                </div>
            )}

            {/* Bio */}
            {bio && (
                <p className="line-clamp-2 text-sm leading-relaxed text-[var(--cm-text-dim)]">
                    {bio}
                </p>
            )}
        </Card>
    );
>>>>>>> Stashed changes
}