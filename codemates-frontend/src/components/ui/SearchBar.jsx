import { Search } from "lucide-react";

/**
 * Search input styled to match the reference landing page search bar
 * (dark surface fill, icon on the left, indigo focus border).
 *
 * Controlled component — the caller owns the value.
 *
 * Props:
 * - value / onChange   standard controlled input pair
 * - placeholder        string
 * - onSubmit           optional, called on Enter key
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  onSubmit,
  className = "",
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface)] px-4 py-3 transition-colors focus-within:border-[var(--cm-indigo)] ${className}`}
    >
      <Search size={18} className="shrink-0 text-[var(--cm-muted)]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit?.(value);
        }}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-[var(--cm-text)] placeholder:text-[var(--cm-muted)] focus:outline-none"
      />
    </div>
  );
}