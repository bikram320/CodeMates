/**
 * Small inline loading spinner. Uses currentColor so it inherits whatever
 * text color it's placed in (e.g. white inside a primary Button).
 *
 * Props:
 * - size  "sm" | "md" | "lg"   default "md"
 */

const SIZES = {
  sm: 14,
  md: 20,
  lg: 28,
};

export default function Spinner({ size = "md", className = "" }) {
  const px = SIZES[size] ?? SIZES.md;

  return (
    <svg
      role="status"
      aria-label="Loading"
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      className={`animate-spin text-current ${className}`}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        opacity="0.2"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}