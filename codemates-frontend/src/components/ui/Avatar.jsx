<<<<<<< Updated upstream
export default function Avatar({ name = "", size = 36, className = "" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--cm-indigo-soft)] text-xs font-medium text-[var(--cm-lavender)] ${className}`}
    >
      {initials || "?"}
    </span>
=======
/**
 * src/components/ui/Avatar.jsx
 *
 * Renders a real avatar image when one exists, otherwise falls back to a
 * colored circle showing the first letter of the username (or name).
 *
 * Why this exists: ProfileSearchResult from discovery-service doesn't
 * actually carry a usable avatarUrl today, so every <img src={avatarUrl}>
 * in the app was just rendering a broken image. This gives every developer
 * without a real photo a consistent, distinct-looking placeholder instead.
 *
 * The color is picked deterministically (hashed from username/name), not
 * re-randomized on every render — so a given person always gets the same
 * color across reloads/re-renders, while still looking effectively random
 * from one person to the next.
 *
 * Sizing is controlled by the caller via `className` (e.g. "h-12 w-12
 * text-sm"), same convention as the rest of this codebase's components —
 * pass a text-* size alongside the h- /w-* so the initial scales with the
* circle.
*
* Props:
* - name        string — used as a fallback seed/alt text if no username
* - username     string — preferred seed for both the initial and the color
* - avatarUrl    string | falsy — real photo URL, if one exists
* - className    sizing/utility classes (h-*, w-*, text-*, etc.)**
**/

// A fixed palette of readable bg/text combinations. Kept independent of the
// app's --cm-* theme tokens on purpose: those are tuned for surfaces/borders,
// not for a wide spread of distinct, recognizable per-person colors.
const AVATAR_PALETTE = [
  { bg: "bg-rose-500", text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-lime-600", text: "text-white" },
  { bg: "bg-emerald-500", text: "text-white" },
  { bg: "bg-teal-500", text: "text-white" },
  { bg: "bg-cyan-600", text: "text-white" },
  { bg: "bg-sky-500", text: "text-white" },
  { bg: "bg-blue-500", text: "text-white" },
  { bg: "bg-indigo-500", text: "text-white" },
  { bg: "bg-violet-500", text: "text-white" },
  { bg: "bg-fuchsia-500", text: "text-white" },
  { bg: "bg-pink-500", text: "text-white" },
];

function paletteIndexFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // keep it a 32-bit int
  }
  return Math.abs(hash) % AVATAR_PALETTE.length;
}

function getInitials(value) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

export default function Avatar({ name, username, avatarUrl, src, size, className = "" }) {
  const resolvedAvatarUrl = avatarUrl || src;
  const seed = username || name || "?";
  const initial = getInitials(name || username || "?");
  const dimension = typeof size === "number"
    ? { width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px` }
    : undefined;

  if (resolvedAvatarUrl) {
    return (
        <img
            src={resolvedAvatarUrl}
            alt={name || username}
            style={dimension}
            className={`shrink-0 rounded-full object-cover ${className}`}
        />
    );
  }

  const { bg, text } = AVATAR_PALETTE[paletteIndexFor(seed)];

  return (
      <div
          role="img"
          aria-label={name || username || "developer avatar"}
          style={dimension}
          className={`flex shrink-0 items-center justify-center rounded-full font-semibold ${bg} ${text} ${className}`}
      >
        {initial}
      </div>
>>>>>>> Stashed changes
  );
}