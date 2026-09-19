import Card from "../ui/Card";
import Badge from "../ui/Badge";
import SkillBadge from "../developer/SkillBadge";

const SECTION_TITLE =
  "mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--cm-muted)]";

/**
 * Main content block on the project details page: the full description
 * plus goals, required skills, and roles the project is recruiting for.
 *
 * Props:
 * - description      string — the detailed (not short) project description
 * - goals            string[]
 * - requiredSkills   string[]
 * - rolesNeeded      string[]
 */
export default function ProjectOverview({
  description,
  goals = [],
  requiredSkills = [],
  rolesNeeded = [],
  className = "",
}) {
  return (
    <Card className={`flex flex-col gap-6 ${className}`}>
      <div>
        <h2 className={SECTION_TITLE}>About this project</h2>
        <p className="text-sm leading-relaxed text-[var(--cm-text-dim)]">
          {description}
        </p>
      </div>

      {goals.length > 0 && (
        <div>
          <h2 className={SECTION_TITLE}>Goals</h2>
          <ul className="flex flex-col gap-2">
            {goals.map((goal) => (
              <li
                key={goal}
                className="flex items-start gap-2 text-sm text-[var(--cm-text-dim)]"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--cm-indigo)]" />
                {goal}
              </li>
            ))}
          </ul>
        </div>
      )}

      {requiredSkills.length > 0 && (
        <div>
          <h2 className={SECTION_TITLE}>Required Skills</h2>
          <div className="flex flex-wrap gap-1.5">
            {requiredSkills.map((skill) => (
              <SkillBadge key={skill} skill={skill} />
            ))}
          </div>
        </div>
      )}

      {rolesNeeded.length > 0 && (
        <div>
          <h2 className={SECTION_TITLE}>Roles Needed</h2>
          <div className="flex flex-wrap gap-1.5">
            {rolesNeeded.map((role) => (
              <Badge key={role} variant="outline">
                {role}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}