/**
 * Shared pieces for the Project Settings page.
 *
 *   PROJECT_SECTION_IDS   anchor ids (header nav ↔ sections)
 *   <TagEditor>           add / remove short tags (used for the tech stack)
 *   <ConfirmDialog>       modal for destructive or hard-to-undo actions, with an
 *                         optional "type the name to confirm" step
 *
 * The form building blocks (SettingsSection, Field, Select, ToggleRow,
 * FormActions, buttons…) come from ../settings/settingsShared so this page
 * looks and behaves like Account Settings.
 */

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Plus, X } from 'lucide-react';

import {
  inputClass,
  secondaryButtonClass,
} from '../settings/settingsShared';

export const PROJECT_SECTION_IDS = {
  general: 'project-settings-general',
  repository: 'project-settings-repository',
  team: 'project-settings-team',
  danger: 'project-settings-danger',
};

/* ── TagEditor ───────────────────────────────────────────────────────────── */

/**
 * Props: id, label, tags string[], onChange(tags), noun ('technology'),
 *        max (15), maxLength (30), placeholder, suggestions string[]
 */
export function TagEditor({
  id,
  label,
  tags,
  onChange,
  noun = 'item',
  max = 15,
  maxLength = 30,
  placeholder = 'Add one and press Enter',
  suggestions = [],
}) {
  const [input, setInput] = useState('');
  const [problem, setProblem] = useState('');

  const addTags = (raw) => {
    const candidates = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (candidates.length === 0) return;

    const next = [...tags];
    let message = '';

    for (const name of candidates) {
      if (name.length > maxLength) {
        message = `Names can be up to ${maxLength} characters.`;
      } else if (next.some((t) => t.toLowerCase() === name.toLowerCase())) {
        message = `${name} is already on the list.`;
      } else if (next.length >= max) {
        message = `You can add up to ${max} ${noun}s.`;
        break;
      } else {
        next.push(name);
      }
    }

    onChange(next);
    setProblem(message);
    if (!message) setInput('');
  };

  const remove = (name) => {
    onChange(tags.filter((t) => t !== name));
    setProblem('');
  };

  const remaining = suggestions
    .filter((s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase()))
    .slice(0, 5);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#F5F5F5]">
        {label}
      </label>

      {tags.length > 0 ? (
        <ul className="mb-3 flex flex-wrap gap-1.5" aria-label={label}>
          {tags.map((tag) => (
            <li
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-[#1D1A40] py-0.5 pl-2 pr-1 font-mono text-[11px] text-[#C9A8FF]"
            >
              {tag}
              <button
                type="button"
                onClick={() => remove(tag)}
                aria-label={`Remove ${tag}`}
                className="flex h-5 w-5 items-center justify-center rounded text-[#8B88AE] transition-colors
                           hover:bg-[#2E2A66] hover:text-[#F5F5F5]
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
              >
                <X size={11} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mb-3 text-xs text-[#6B6890]">Nothing added yet.</p>
      )}

      <div className="flex gap-2">
        <input
          id={id}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (problem) setProblem('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault(); // Enter must not submit the surrounding form
              addTags(input);
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          aria-describedby={`${id}-hint`}
          className={inputClass(Boolean(problem))}
        />
        <button
          type="button"
          onClick={() => addTags(input)}
          disabled={!input.trim()}
          aria-label={`Add ${noun}`}
          className={`${secondaryButtonClass} shrink-0 px-3`}
        >
          <Plus size={15} />
        </button>
      </div>

      <p id={`${id}-hint`} className={`mt-1.5 text-xs ${problem ? 'text-red-300' : 'text-[#6B6890]'}`}>
        {problem || `${tags.length}/${max}. Separate several with commas.`}
      </p>

      {remaining.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#6B6890]">Suggested:</span>
          {remaining.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addTags(s)}
              className="rounded-md border border-[#2E2A66] px-2 py-0.5 font-mono text-[11px] text-[#8B88AE]
                         transition-colors hover:border-[#6C7BFF] hover:text-[#F5F5F5]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── ConfirmDialog ───────────────────────────────────────────────────────── */

const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [href]';

function DialogBody({
  title,
  description,
  consequences,
  confirmLabel,
  cancelLabel,
  tone,
  requireText,
  onConfirm,
  onCancel,
}) {
  const [typed, setTyped] = useState('');
  const dialogRef = useRef(null);
  const inputRef = useRef(null);
  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);

  useEffect(() => {
    onCancelRef.current = onCancel;
  }, [onCancel]);

  // Focus, scroll lock, Escape and a minimal focus trap.
  useEffect(() => {
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Destructive dialogs open on the safe choice unless there's a field to fill in.
    (inputRef.current ?? cancelRef.current)?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancelRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll(FOCUSABLE);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  const canConfirm = !requireText || typed.trim() === requireText;
  const danger = tone === 'danger';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canConfirm) onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <form
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        onSubmit={handleSubmit}
        className={`max-h-[92vh] w-full max-w-md overflow-y-auto rounded-xl border bg-[#0A0918] shadow-2xl shadow-black/60 ${
          danger ? 'border-red-400/30' : 'border-[#2E2A66]'
        }`}
      >
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                danger ? 'bg-red-500/15 text-red-300' : 'bg-amber-400/15 text-amber-300'
              }`}
            >
              <AlertTriangle size={17} />
            </span>
            <div className="min-w-0">
              <h2 id="confirm-dialog-title" className="text-base font-semibold text-[#F5F5F5]">
                {title}
              </h2>
              <p id="confirm-dialog-desc" className="mt-1 text-sm leading-relaxed text-[#A9A6C8]">
                {description}
              </p>
            </div>
          </div>

          {consequences.length > 0 && (
            <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm text-[#8B88AE]">
              {consequences.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          )}

          {requireText && (
            <div className="mt-5">
              <label htmlFor="confirm-dialog-input" className="mb-1.5 block text-sm font-medium text-[#F5F5F5]">
                Type <span className="font-mono text-[#C9A8FF]">{requireText}</span> to confirm
              </label>
              <input
                ref={inputRef}
                id="confirm-dialog-input"
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className={inputClass(false)}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[#1C1A38] px-5 py-4 sm:flex-row sm:justify-end">
          <button ref={cancelRef} type="button" onClick={onCancel} className={secondaryButtonClass}>
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={!canConfirm}
            className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold
                        transition-colors disabled:cursor-not-allowed disabled:opacity-40
                        focus:outline-none focus-visible:ring-2 ${
                          danger
                            ? 'bg-red-500/90 text-white hover:bg-red-500 disabled:hover:bg-red-500/90 focus-visible:ring-red-300/70'
                            : 'bg-amber-400 text-[#0A0918] hover:bg-amber-300 disabled:hover:bg-amber-400 focus-visible:ring-amber-200'
                        }`}
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

/**
 * Props: open, title, description, consequences string[], confirmLabel,
 *        cancelLabel ('Cancel'), tone ('danger' | 'warning'),
 *        requireText (string the user must type), onConfirm, onCancel
 */
export function ConfirmDialog({
  open,
  title,
  description,
  consequences = [],
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  requireText,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <DialogBody
      title={title}
      description={description}
      consequences={consequences}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone={tone}
      requireText={requireText}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
}