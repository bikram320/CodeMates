import { AlertCircle } from "lucide-react";

/** Shared class string for text inputs, textareas and selects. */
export const controlClass = (invalid = false) =>
  "w-full rounded-lg border bg-[#1D1A40]/40 px-3.5 py-2.5 text-sm text-[#F5F5F5] transition-colors " +
  "placeholder:text-[#6B6890] focus:outline-none focus-visible:ring-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  (invalid
    ? "border-red-400/60 focus-visible:ring-red-400/40"
    : "border-[#2E2A66] hover:border-[#3A3670] focus:border-[#6C7BFF] focus-visible:ring-[#6C7BFF]/40");

/** id + ARIA props that tie a control to its FormField's hint/error text. */
export const fieldProps = (id, error, hint, required = false) => ({
  id,
  "aria-invalid": error ? true : undefined,
  "aria-required": required || undefined,
  "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
});

/**
 * Label + control slot + hint/error text.
 * Pass `group` when the child is a set of buttons/radios rather than one input;
 * the label then names the group (aria-labelledby="<id>-label") instead of a control.
 */
export function FormField({ id, label, required = false, optional = false, hint, error, counter, group = false, children }) {
  const Label = group ? "div" : "label";
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Label
          {...(group ? { id: `${id}-label` } : { htmlFor: id })}
          className="text-sm font-medium text-[#F5F5F5]"
        >
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-[#C9A8FF]">
              *
            </span>
          )}
          {optional && <span className="ml-2 text-xs font-normal text-[#6B6890]">Optional</span>}
        </Label>
        {counter}
      </div>

      {children}

      {error ? (
        <p id={`${id}-error`} className="flex items-start gap-1.5 text-xs leading-relaxed text-red-300">
          <AlertCircle size={13} aria-hidden="true" className="mt-px shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-[#6B6890]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

/** A titled card that groups related form fields. */
export default function ProjectFormSection({ title, description, children }) {
  return (
    <section className="rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5 sm:p-6">
      <header>
        <h2 className="text-base font-semibold text-[#F5F5F5]">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-[#8B86B8]">{description}</p>}
      </header>
      <div className="mt-5 flex flex-col gap-5">{children}</div>
    </section>
  );
}