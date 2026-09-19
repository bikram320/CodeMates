/**
 * Generic surface container. Used for feature cards, dashboard panels,
 * developer/project cards, etc. — anything that needs a bordered,
 * slightly-raised block matching the design system.
 *
 * Props:
 * - padding    "sm" | "md" | "lg" | "none"   default "md"
 * - hoverable  boolean   adds a subtle border/shadow lift on hover,
 *              use for cards that are clickable or link somewhere
 * - as         element/component to render as (default "div")
 */

const PADDING = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  padding = "md",
  hoverable = false,
  as: Component = "div",
  className = "",
  ...rest
}) {
  return (
    <Component
      className={`rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] ${
        PADDING[padding] ?? PADDING.md
      } ${
        hoverable
          ? "transition-colors hover:border-[var(--cm-border-strong)]"
          : ""
      } ${className}`}
      {...rest}
    >
      {children}
    </Component>
  );
}