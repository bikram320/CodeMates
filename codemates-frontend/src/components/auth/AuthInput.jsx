import { useId, useState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";

/**
 * Controlled input for auth forms.
 *
 * - `type="password"` automatically gets a show/hide toggle.
 * - `error` shows a message under the field and marks it invalid for screen readers.
 * - `icon` is an optional lucide icon component shown inside the field.
 * - `multiline` renders a <textarea> (`rows` sets its height) for longer text; skip `icon` there.
 * Any other props (autoComplete, inputMode, placeholder, …) go to the <input>.
 */
export default function AuthInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  hint,
  icon: Icon,
  disabled = false,
  multiline = false,
  rows = 3,
  ...rest
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);
  const Control = multiline ? "textarea" : "input";

  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-[#F3F4F6]">
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
          />
        )}

        <Control
          id={inputId}
          {...(multiline ? { rows } : { type: isPassword && visible ? "text" : type })}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`w-full rounded-lg border bg-transparent py-2.5 text-base text-[#F3F4F6] transition-colors
                      placeholder:text-[#6B7280] focus:outline-none focus-visible:ring-2
                      disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm ${multiline ? "resize-y" : ""}
                      ${Icon ? "pl-10" : "pl-3.5"} ${isPassword ? "pr-11" : "pr-3.5"} ${
            error
              ? "border-red-400/70 focus-visible:ring-red-400/40"
              : "border-[#9CA3AF]/50 hover:border-[#9CA3AF] focus:border-[#6C7BFF] focus-visible:ring-[#6C7BFF]/40"
          }`}
          {...rest}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            disabled={disabled}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-[#9CA3AF] transition-colors
                       hover:text-[#F3F4F6] disabled:opacity-60
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            {visible ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="flex items-start gap-1.5 text-xs leading-relaxed text-red-300">
          <AlertCircle size={13} aria-hidden="true" className="mt-px shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs leading-relaxed text-[#9CA3AF]">
          {hint}
        </p>
      ) : null}
    </div>
  );
}