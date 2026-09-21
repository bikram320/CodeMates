/**
 * Shared avatar with initials fallback when no image is available.
 *
 * This consolidates a pattern that's been inlined separately in several
 * places (Navbar, DeveloperCard, ChatHeader, ProjectMemberPreview,
 * ContributionCard...) — new components should use this instead of
 * another one-off <img>. Existing inline copies aren't being refactored
 * as part of this change, to stay in scope.
 *
 * Props:
 * - name   string — used for initials fallback and alt text
 * - src    string | null
 * - size   number (px), default 36
 */
export default function Avatar({ name = "", src = null, size = 36, className = "" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--cm-indigo-soft)] text-xs font-medium text-[var(--cm-lavender)] ${className}`}
    >
      {initials || "?"}
    </span>
  );
}