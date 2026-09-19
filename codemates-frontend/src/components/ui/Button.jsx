import { Link } from "react-router-dom";
import Spinner from "./Spinner";

/**
 * Shared button. Renders as a router <Link> when `to` is given, a plain
 * <a> when `href` is given, otherwise a real <button>.
 *
 * Props:
 * - variant    "primary" | "secondary" | "outline" | "ghost"   default "primary"
 * - size       "sm" | "md" | "lg"   default "md"
 * - to         router path — renders as <Link>
 * - href       external url — renders as <a>
 * - loading    boolean — shows a spinner and disables interaction
 * - fullWidth  boolean
 * - leftIcon / rightIcon   Lucide icon components
 */

const VARIANTS = {
  primary: "bg-[var(--cm-indigo)] text-white hover:bg-[var(--cm-indigo-hover)]",
  secondary:
    "bg-[var(--cm-surface-2)] text-[var(--cm-text)] border border-[var(--cm-border)] hover:border-[var(--cm-border-strong)]",
  outline:
    "border border-[var(--cm-border-strong)] text-[var(--cm-text-dim)] bg-transparent hover:text-[var(--cm-text)] hover:border-[var(--cm-indigo)]",
  ghost:
    "text-[var(--cm-text-dim)] bg-transparent hover:text-[var(--cm-text)] hover:bg-[var(--cm-surface)]",
};

const SIZES = {
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  to,
  href,
  type = "button",
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = "",
  ...rest
}) {
  const classes = `inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
    VARIANTS[variant] ?? VARIANTS.primary
  } ${SIZES[size] ?? SIZES.md} ${fullWidth ? "w-full" : ""} ${className}`;

  const content = (
    <>
      {loading ? (
        <Spinner size="sm" />
      ) : (
        LeftIcon && <LeftIcon size={size === "sm" ? 14 : 16} />
      )}
      {children}
      {!loading && RightIcon && <RightIcon size={size === "sm" ? 14 : 16} />}
    </>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={classes}
        aria-disabled={disabled || loading}
        {...rest}
      >
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
}