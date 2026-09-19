import { ArrowRight, Users } from "lucide-react";
import { Link } from "react-router-dom";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import SkillBadge from "../developer/SkillBadge";

/**
 * Card summarizing one project in the Discover Projects grid.
 *
 * Reuses SkillBadge (built for developer skills) for tech stack pills —
 * same concept, a short technology/skill name, so no need for a separate
 * component.
 *
 * Props:
 * - id, name, shortDescription, techStack (string[])
 * - projectType, requiredExperience, status
 * - teamSize   { current, max }
 * - requiredRoles   string[]
 */

const STATUS_VARIANT = {
  Recruiting: "soft",
  "In Progress": "outline",
  Completed: "neutral",
};

export default function ProjectCard({
  id,
  name,
  shortDescription,
  techStack = [],
  projectType,
  teamSize,
  requiredExperience,
  requiredRoles = [],
  status,
  className = "",
}) {
  return (
    <Card hoverable padding="md" className={`flex flex-col gap-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[var(--cm-text)]">
            {name}
          </h3>
          {projectType && (
            <p className="mt-0.5 text-xs text-[var(--cm-muted)]">
              {projectType}
            </p>
          )}
        </div>
        {status && (
          <Badge variant={STATUS_VARIANT[status] ?? "neutral"} className="shrink-0">
            {status}
          </Badge>
        )}
      </div>

      {shortDescription && (
        <p className="line-clamp-2 text-sm leading-relaxed text-[var(--cm-text-dim)]">
          {shortDescription}
        </p>
      )}

      {techStack.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {techStack.map((tech) => (
            <SkillBadge key={tech} skill={tech} />
          ))}
        </div>
      )}

      {requiredRoles.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-[var(--cm-muted)]">Looking for</p>
          <div className="flex flex-wrap gap-1.5">
            {requiredRoles.map((role) => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 text-xs text-[var(--cm-muted)]">
          {teamSize && (
            <span className="flex items-center gap-1">
              <Users size={13} />
              {teamSize.current}/{teamSize.max}
            </span>
          )}
          {requiredExperience && <Badge variant="neutral">{requiredExperience}</Badge>}
        </div>
          
        <Button
          to={`/projects/${id}`}
          variant="secondary"
          size="sm"
          rightIcon={ArrowRight}
        >
          View Project
        </Button>
      </div>
    </Card>
  );
}