import Card from "../ui/Card";

/**
 * Main content block on the project details page.
 *
 * goals / requiredSkills / rolesNeeded were removed because ProjectResponse
 * has no matching fields. Re-add them here if the backend ever exposes them.
 *
 * The page title (an h1) lives in ProjectHeader, so this heading is an h2.
 *
 * Props:
 * - description   string
 */
export default function ProjectOverview({ description, className = "" }) {
    return (
        <Card className={`flex flex-col gap-3 ${className}`}>
            <h2 className="page-section-heading" style={{ fontSize: "1.15rem" }}>
                About this project
            </h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-[var(--cm-text-dim)]">
                {description || "No description provided."}
            </p>
        </Card>
    );
}