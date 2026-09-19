import { FaGithub } from "react-icons/fa";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import SkillBadge from "../developer/SkillBadge";

/**
 * Hero section for a project's details page: name, quick-glance status/
 * type badges, tech stack, and the primary join action + GitHub link.
 *
 * Props:
 * - name, description   identity (required)
 * - status, projectType   shown as badges next to the name
 * - techStack   string[]
 * - githubUrl   optional external link
 * - joined      boolean — swaps the CTA to a "Request Sent" state
 * - onJoin      click handler for the join button
 */
const STATUS_VARIANT = {
  Recruiting: "soft",
  "In Progress": "outline",
  Completed: "neutral",
};

export default function ProjectHeader({
  name,
  description,
  status,
  projectType,
  techStack = [],
  githubUrl,
  joined = false,
  onJoin,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-[var(--cm-text)]">
            {name}
          </h1>
          {status && (
            <Badge variant={STATUS_VARIANT[status] ?? "neutral"}>
              {status}
            </Badge>
          )}
          {projectType && <Badge variant="outline">{projectType}</Badge>}
        </div>

        {description && (
          <p className="mt-2 max-w-xl text-sm text-[var(--cm-text-dim)]">
            {description}
          </p>
        )}

        {techStack.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {techStack.map((tech) => (
              <SkillBadge key={tech} skill={tech} />
            ))}
          </div>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
        <Button variant={joined ? "secondary" : "primary"} onClick={onJoin}>
          {joined ? "Request Sent" : "Request to Join"}
        </Button>
        {githubUrl && (
          <Button href={githubUrl} variant="outline" size="sm" leftIcon={FaGithub}>
            GitHub
          </Button>
        )}
      </div>
    </div>
  );
}