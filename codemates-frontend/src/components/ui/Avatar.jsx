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
  );
}