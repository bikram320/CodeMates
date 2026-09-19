/**
 * Small pill for a single skill/technology name (e.g. "React", "Go").
 * Visually similar to the generic Badge but kept as its own component
 * since skills are a distinct, reused concept across developer cards,
 * profile headers, and (later) project cards.
 *
 * Props:
 * - skill  string (required) — the skill name to display
 */
export default function SkillBadge({ skill, className = "" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-[var(--cm-indigo-soft)] px-2.5 py-1 text-xs font-medium text-[var(--cm-lavender)] ${className}`}
    >
      {skill}
    </span>
  );
}