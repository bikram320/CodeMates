import { ChevronDown, Pencil } from 'lucide-react';

export const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── Buttons ─────────────────────────────────────────────────────────────── */

export const primaryButtonClass =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2 text-sm font-semibold ' +
  '!text-white transition-colors hover:bg-[#8190FF] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#6C7BFF] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60';

export const secondaryButtonClass =
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#D9DCE1] bg-white px-4 py-2 text-sm font-medium ' +
  'text-[#16171D] transition-colors hover:border-[#6C7BFF] hover:bg-[#6C7BFF]/5 ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-[#D9DCE1] disabled:hover:bg-white ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60';

/** Small outlined "Edit" button for card headers. */
export function EditButton({ onClick, label = 'Edit', ...rest }) {
  return (
    <button type="button" onClick={onClick} className={`${secondaryButtonClass} !px-3 !py-1.5 text-xs`} {...rest}>
      {label}
      <Pencil size={12} aria-hidden="true" />
    </button>
  );
}

/* ── Layout ──────────────────────────────────────────────────────────────── */

export const cardClass = 'rounded-2xl bg-white shadow-[0_2px_12px_rgba(16,24,40,0.06)]';

export function SettingsSection({ id, title, description, badge, action = null, tone = 'default', children }) {
  const danger = tone === 'danger';

  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      className={`${cardClass} scroll-mt-6 focus:outline-none ${danger ? 'ring-1 ring-red-300' : ''}`}
    >
      <div
        className={`flex items-center justify-between gap-3 border-b px-6 py-4 sm:px-10 sm:py-5 ${
          danger ? 'border-red-200' : 'border-[#ECEEF1]'
        }`}
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              id={`${id}-title`}
              className={`text-base font-semibold ${danger ? 'text-red-700' : 'text-[#16171D]'}`}
            >
              {title}
            </h2>
            {badge}
          </div>
          {description && <p className="mt-1 text-sm text-[#6B7280]">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function SectionBody({ children, className = '' }) {
  return <div className={`space-y-5 px-6 py-6 sm:px-10 ${className}`}>{children}</div>;
}

/** Read-only label/value grid, like the reference cards. */
export function InfoGrid({ children }) {
  return <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-3">{children}</dl>;
}

export function InfoItem({ label, value, mono = false, className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-xs text-[#6B7280]">{label}</dt>
      <dd className={`mt-1.5 break-words text-sm font-medium text-[#16171D] ${mono ? 'font-mono' : ''}`}>
        {value || <span className="font-normal text-[#9CA3AF]">Not set</span>}
      </dd>
    </div>
  );
}

export function FormActions({
  dirty,
  onCancel,
  saveLabel = 'Save changes',
  cancelLabel = 'Cancel',
  leading = null,
  alwaysAllowCancel = false,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#ECEEF1] px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-10">
      <div className="flex min-h-[20px] flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {leading}
        {dirty && (
          <span className="inline-flex items-center gap-1.5 text-[#6B7280]" role="status">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Unsaved changes
          </span>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={!dirty && !alwaysAllowCancel}
          title="Discard unsaved changes"
          className={secondaryButtonClass}
        >
          {cancelLabel}
        </button>
        <button type="submit" disabled={!dirty} className={primaryButtonClass}>
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

/* ── Form controls ───────────────────────────────────────────────────────── */

export function inputClass(hasError = false) {
  return (
    'w-full rounded-lg border bg-white px-3 py-2.5 text-base text-[#16171D] ' +
    'placeholder:text-[#9CA3AF] sm:text-sm focus:outline-none focus:ring-2 ' +
    (hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-400/20'
      : 'border-[#D9DCE1] hover:border-[#B8BDC6] focus:border-[#6C7BFF] focus:ring-[#6C7BFF]/30')
  );
}

export const describedBy = (id, { error, hint } = {}) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export function Field({ id, label, hint, error, optional = false, className = '', children }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium !text-[#16171D]">
        {label}
        {optional && <span className="text-xs font-normal text-[#9CA3AF]">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#6B7280]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Select({ id, value, onChange, options, error = false, ...rest }) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass(error)} cursor-pointer appearance-none pr-9`}
        {...rest}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280]"
      />
    </div>
  );
}

export function ToggleSwitch({ id, checked, onChange, label, labelledBy, describedByIds, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      aria-labelledby={labelledBy}
      aria-describedby={describedByIds}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60 focus-visible:ring-offset-2
                  focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-50 ${
                    checked ? 'bg-[#6C7BFF]' : 'bg-[#D1D5DB]'
                  }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

export function ToggleRow({ id, label, description, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-medium text-[#16171D]">
          {label}
        </p>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-xs leading-relaxed text-[#6B7280]">
            {description}
          </p>
        )}
      </div>
      <ToggleSwitch
        id={id}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        labelledBy={`${id}-label`}
        describedByIds={description ? `${id}-desc` : undefined}
      />
    </div>
  );
}

export function DemoBadge({ children = 'demo only', title = 'Nothing is saved to a server yet' }) {
  return (
    <span
      title={title}
      className="inline-flex items-center rounded-md border border-[#6C7BFF]/30 bg-[#6C7BFF]/10
                 px-1.5 py-0.5 font-mono text-[10px] text-[#4F5DE8]"
    >
      {children}
    </span>
  );
}