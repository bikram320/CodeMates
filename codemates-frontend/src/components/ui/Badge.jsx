/**
 * Generic pill label. For skill-specific styling use the existing
 * SkillBadge component instead — this is for everything else: experience
 * level, availability status, plan tags, counts, etc.
 *
 * Props:
 * - variant  "solid" | "soft" | "outline" | "neutral"   default "soft"
 * - size     "sm" | "md"   default "sm"
 * - icon     optional Lucide icon component
 */

const VARIANTS = {
  solid: "bg-[var(--cm-indigo)] text-white",
  soft: "bg-[var(--cm-indigo-soft)] text-[var(--cm-lavender)]",
  outline:
    "border border-[var(--cm-border-strong)] text-[var(--cm-text-dim)] bg-transparent",
  neutral: "bg-[var(--cm-surface)] text-[var(--cm-text-dim)]",
};

const SIZES = {
  sm: "px-1.5 py-0.5 text-xs gap-1",
  md: "px-2 py-0.5 text-sm gap-1",
};

export default function Badge({
  children,
  variant = "soft",
  size = "sm",
  icon: Icon = null,
  className = "",
}) {
  return (
    <span
      className={`inline-flex items-center rounded-[var(--cm-radius-sm)] font-medium ${
        VARIANTS[variant] ?? VARIANTS.soft
      } ${SIZES[size] ?? SIZES.sm} ${className}`}
    >
      {Icon && <Icon size={size === "sm" ? 12 : 14} />}
      {children}
    </span>
  );
}