/**
 * Generic form building blocks shared across CodeMates settings-style pages
 * (Project Settings, the Profile page, and previously Account Settings).
 *
 *   isEqual(a, b)                    deep-ish equality for dirty tracking
 *   <SettingsSection>                titled card
 *   <SectionBody>                    padded content area inside a card
 *   <FormActions>                    "Unsaved changes" + Cancel / Save row
 *   <Field>                          label + control + hint / error
 *   describedBy(id, { error, hint })
 *   inputClass(hasError)             text input / textarea styling
 *   <Select>                         styled native select
 *   <ToggleSwitch>, <ToggleRow>      accessible on/off switches
 *   <DemoBadge>                      "demo only" chip for actions that do nothing yet
 *   primaryButtonClass / secondaryButtonClass
 */

import { ChevronDown } from 'lucide-react';

export const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/* ── Buttons ─────────────────────────────────────────────────────────────── */

export const primaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2 text-sm font-semibold ' +
  'text-[#0A0918] transition-colors hover:bg-[#8190FF] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#6C7BFF] ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF]';

export const secondaryButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium ' +
  'text-[#F5F5F5] transition-colors hover:bg-[#1D1A40] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60';

/* ── Layout ──────────────────────────────────────────────────────────────── */

export function SettingsSection({ id, title, description, badge, tone = 'default', children }) {
  const danger = tone === 'danger';

  return (
    <section
      id={id}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      className={`scroll-mt-6 rounded-xl border bg-[#0A0918] focus:outline-none ${
        danger ? 'border-red-400/30' : 'border-[#1C1A38]'
      }`}
    >
      <div
        className={`border-b px-5 py-4 ${
          danger ? 'border-red-400/20' : 'border-[#1C1A38]'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2
            id={`${id}-title`}
            className={`text-base font-semibold ${
              danger ? 'text-red-200' : 'text-[#F5F5F5]'
            }`}
          >
            {title}
          </h2>
          {badge}
        </div>
        {description && (
          <p className="mt-1 text-sm text-[#8B88AE]">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

export function SectionBody({ children, className = '' }) {
  return <div className={`space-y-5 p-5 ${className}`}>{children}</div>;
}

export function FormActions({
  dirty,
  onCancel,
  saveLabel = 'Save changes',
  cancelLabel = 'Cancel',
  leading = null,
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-[#1C1A38] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-h-[20px] flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        {leading}
        {dirty && (
          <span className="inline-flex items-center gap-1.5 text-[#8B88AE]" role="status">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
            Unsaved changes
          </span>
        )}
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          disabled={!dirty}
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
    'w-full rounded-lg border bg-[#1D1A40]/50 px-3 py-2.5 text-base text-[#F5F5F5] ' +
    'placeholder:text-[#6B6890] sm:text-sm focus:outline-none focus:ring-2 ' +
    (hasError
      ? 'border-red-400/70 focus:border-red-400 focus:ring-red-400/20'
      : 'border-[#2E2A66] hover:border-[#3A3580] focus:border-[#6C7BFF] focus:ring-[#6C7BFF]/30')
  );
}

export const describedBy = (id, { error, hint } = {}) =>
  error ? `${id}-error` : hint ? `${id}-hint` : undefined;

export function Field({ id, label, hint, error, optional = false, className = '', children }) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-baseline gap-1.5 text-sm font-medium text-[#F5F5F5]"
      >
        {label}
        {optional && (
          <span className="text-xs font-normal text-[#6B6890]">(optional)</span>
        )}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-xs text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#6B6890]">
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
        className={`${inputClass(error)} appearance-none pr-9 [color-scheme:dark]`}
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
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6890]"
      />
    </div>
  );
}

export function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  labelledBy,
  describedByIds,
  disabled = false,
}) {
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
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF] focus-visible:ring-offset-2
                  focus-visible:ring-offset-[#0A0918] disabled:cursor-not-allowed disabled:opacity-50 ${
                    checked ? 'bg-[#6C7BFF]' : 'bg-[#2E2A66]'
                  }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 rounded-full transition-transform duration-150 ${
          checked ? 'translate-x-6 bg-white' : 'translate-x-1 bg-[#8B88AE]'
        }`}
      />
    </button>
  );
}

export function ToggleRow({ id, label, description, checked, onChange, disabled = false }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p id={`${id}-label`} className="text-sm font-medium text-[#F5F5F5]">
          {label}
        </p>
        {description && (
          <p id={`${id}-desc`} className="mt-0.5 text-xs leading-relaxed text-[#8B88AE]">
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
      className="inline-flex items-center rounded-md border border-[#C9A8FF]/30 bg-[#C9A8FF]/10
                 px-1.5 py-0.5 font-mono text-[10px] text-[#C9A8FF]"
    >
      {children}
    </span>
  );
}