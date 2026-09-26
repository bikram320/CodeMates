import { FaGithub } from "react-icons/fa";
import { Pencil } from "lucide-react";
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

/**
 * Hero section for a project's details page: name, status/visibility
 * badges, description, tech stack, and a GitHub link.
 *
 * Tech stack renders as its own bordered container underneath the
 * identity block instead of being crammed into the same card.
 *
 * `onEdit` opens the edit-project modal (see ProjectDetails.jsx /
 * EditProjectModal.jsx). It's only rendered when `canManage` is true —
 * mirrors the LEADER-only gating projectApi.updateProject enforces on
 * the server, so the button never appears for someone who'd just get a
 * 403 back.
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
 * - canManage     boolean — show the Edit button (viewer is LEADER)
 * - onEdit        fn — called when Edit is clicked
 */
export default function ProjectHeader({
                                        name,
                                        description,
                                        status,
                                        visibility,
                                        techStack = [],
                                        githubUrl,
                                        canManage = false,
                                        onEdit,
                                        className = "",
                                      }) {
  return (
      <div className={`flex flex-col gap-4 ${className}`}>
        {/* Identity block: name, badges, description, actions */}
        <div className="flex flex-col gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6 sm:flex-row sm:items-start sm:justify-between">
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
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            {canManage && (
                <Button variant="outline" size="sm" leftIcon={Pencil} onClick={onEdit}>
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

        {/* Tech stack: its own container, separate from identity block */}
        {techStack.length > 0 && (
            <div className="rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-4">
              <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]">
                Tech Stack
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {techStack.map((tech) => (
                    <SkillBadge key={tech} skill={tech} />
                ))}
              </div>
            </div>
        )}
      </div>
  );
}