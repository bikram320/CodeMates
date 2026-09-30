import Card from "../ui/Card";

const SECTION_TITLE = "page-section-heading mb-3";

/**
 * Main content block on the project details page.
 *
 * The mock version also rendered goals, requiredSkills, and
 * rolesNeeded sections, but ProjectResponse (the backend DTO) has no
 * matching fields for any of those, so they've been removed rather
 * than left empty. Re-add them here if the backend ever exposes that
 * data.
 *
 * Props:
 * - description   string
 */
export default function ProjectOverview({ description, className = "" }) {
  return (
    <Card className={`flex flex-col gap-6 ${className}`}>
      <div>
        <h1 className={SECTION_TITLE} style={{ fontSize: '1.85rem' }}>About this project</h1>
        <p className="text-sm leading-relaxed text-[var(--cm-text-dim)]">
          {description || "No description provided."}
        </p>
      </div>
    </Card>
  );
}