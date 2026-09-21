/** A horizontal rule with a short label in the middle, e.g. "or". */
export default function AuthDivider({ label = "or", className = "" }) {
  return (
    <div role="separator" className={`flex items-center gap-3 text-xs text-[#9CA3AF] ${className}`}>
      <span aria-hidden="true" className="h-px flex-1 bg-[#9CA3AF]/30" />
      <span>{label}</span>
      <span aria-hidden="true" className="h-px flex-1 bg-[#9CA3AF]/30" />
    </div>
  );
}