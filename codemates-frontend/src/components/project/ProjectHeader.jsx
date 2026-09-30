// src/components/project/ProjectHeader.jsx
import { FaGithub } from "react-icons/fa";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import SkillBadge from "../developer/SkillBadge";

const STATUS_LABELS = {
  ACTIVE: "Active",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const STATUS_VARIANT = {
  ACTIVE: "soft",
  COMPLETED: "neutral",
  ARCHIVED: "outline",
};

const VISIBILITY_LABELS = {
  PUBLIC: "Public",
  PRIVATE: "Private",
};

<<<<<<< Updated upstream
/**
 * Hero section for a project's details page: name, status/visibility
 * badges, tech stack, and a GitHub link.
 *
 * There's no self-serve "join project" endpoint on the backend — only
 * a leader-initiated invite plus invitee accept/reject flow — so the
 * earlier "Request to Join" CTA and `joined`/`onJoin` props have been
 * removed rather than left pointing at nothing. `projectType` is gone
 * too (no matching backend field); `visibility` takes its place since
 * that field actually exists on ProjectResponse.
 *
 * Props:
 * - name          required
 * - description   optional
 * - status        ACTIVE | COMPLETED | ARCHIVED
 * - visibility    PUBLIC | PRIVATE
 * - techStack     string[]
 * - githubUrl     optional external link
 */
=======
>>>>>>> Stashed changes
export default function ProjectHeader({
  name,
  description,
  status,
  visibility,
  techStack = [],
  githubUrl,
  className = "",
}) {
  return (
<<<<<<< Updated upstream
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
              {STATUS_LABELS[status] ?? status}
            </Badge>
          )}
          {visibility && (
            <Badge variant="outline">{VISIBILITY_LABELS[visibility] ?? visibility}</Badge>
          )}
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
=======
      <div className={`flex flex-col gap-4 ${className}`}>
        {/* Identity block: name, badges, description, actions */}
        <div className="flex flex-col gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-[var(--cm-text)]">
                {name}
              </h1>
              {status && (
                  <Badge
                      variant={STATUS_VARIANT[status] ?? "neutral"}
                      className={status === "ACTIVE" ? "!bg-emerald-500/15 !text-emerald-400 !border-emerald-500/30" : ""}
                  >
                    {STATUS_LABELS[status] ?? status}
                  </Badge>
              )}
              {visibility && (
                  <Badge variant="outline">{VISIBILITY_LABELS[visibility] ?? visibility}</Badge>
              )}
            </div>

            {description && (
                <p className="mt-2 max-w-xl text-sm text-[var(--cm-text-dim)]">
                  {description}
                </p>
            )}
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end ">
            {canManage && (
                <Button
                    variant="outline"
                    size="sm"
                    leftIcon={Pencil}
                    onClick={onEdit}
                    className="!bg-[#6C7BFF] !text-white !border-[#6C7BFF] hover:!bg-[#5A6AF0]"
                >
                  Edit
                </Button>
            )}
            {githubUrl && (
                <Button href={githubUrl} variant="outline" size="sm" leftIcon={FaGithub}>
                  GitHub
                </Button>
            )}
          </div>
        </div>

        {/* Tech stack: container back to the original surface color;
            each individual pill now carries the purple instead. */}
        {techStack.length > 0 && (
            <div className="rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-4">
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]">
                Tech Stack
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {techStack.map((tech) => (
                    <SkillBadge
                        key={tech}
                        skill={tech}
                        className="!bg-gray !text-black !border-gray"
                    />
                ))}
              </div>
            </div>
>>>>>>> Stashed changes
        )}
      </div>

      {githubUrl && (
        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <Button href={githubUrl} variant="outline" size="sm" leftIcon={FaGithub}>
            GitHub
          </Button>
        </div>
      )}
    </div>
  );
}