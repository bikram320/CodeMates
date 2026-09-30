export default function EmptyState({ icon: Icon, title, description, action = null, className = "" }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#D9DCE1] bg-white px-6 py-10 text-center ${className}`}
    >
      {Icon && (
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#6C7BFF]/10 text-[#4F5DE8]">
          <Icon size={18} />
        </span>
      )}
      <h3 className="text-base font-medium text-[#16171D]">{title}</h3>
      {description && <p className="max-w-sm text-sm text-[#6B7280]">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}