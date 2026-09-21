/**
 * DangerZone
 *
 * Account deletion, behind a "type your username" confirmation.
 *
 * ⚠️ Nothing is deleted. Confirming calls `onDeleteRequested()` and the page
 * shows a "demo only" message. The real endpoint doesn't exist in the API
 * docs yet.
 *
 * Props:
 *   username           {string}  Must be typed to enable the confirm button
 *   onDeleteRequested  {fn}      ()
 */

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';

import {
  DemoBadge,
  Field,
  SECTION_IDS,
  SectionBody,
  SettingsSection,
  inputClass,
  secondaryButtonClass,
} from './settingsShared';

export default function DangerZone({ username, onDeleteRequested }) {
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const inputRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (confirming) inputRef.current?.focus();
  }, [confirming]);

  const matches = typed.trim().toLowerCase() === username.toLowerCase();

  const close = () => {
    setConfirming(false);
    setTyped('');
    // The trigger button is re-mounted on the next render — focus it then.
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!matches) return;
    onDeleteRequested();
    setConfirming(false);
    setTyped('');
  };

  return (
    <SettingsSection
      id={SECTION_IDS.danger}
      tone="danger"
      title="Danger zone"
      description="Irreversible actions. Take a moment before you continue."
      badge={<DemoBadge title="Deleting your account isn’t implemented yet — nothing will be deleted" />}
    >
      <SectionBody>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Delete account</h3>
            <p className="mt-1 text-sm text-[#8B88AE]">
              Permanently remove your profile, connections and messages. This can&apos;t be undone.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[#8B88AE]">
              <li>You&apos;ll be removed from every project you&apos;re on.</li>
              <li>Projects you lead must be transferred or deleted first.</li>
              <li>Your contribution history is removed from project leaderboards.</li>
            </ul>
          </div>

          {!confirming && (
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setConfirming(true)}
              aria-expanded={confirming}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-400/40
                         px-4 py-2 text-sm font-medium text-red-300 transition-colors
                         hover:bg-red-500/10 hover:text-red-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
            >
              <Trash2 size={14} />
              Delete account
            </button>
          )}
        </div>

        {confirming && (
          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') close();
            }}
            className="rounded-xl border border-red-400/30 bg-red-500/5 p-4"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-300" aria-hidden="true" />
              <p className="text-sm text-red-100">
                This will permanently delete your account and can&apos;t be reversed.
              </p>
            </div>

            <Field
              id="danger-confirm"
              label={
                <>
                  Type <span className="font-mono text-[#C9A8FF]">{username}</span> to confirm
                </>
              }
              className="mt-4 sm:max-w-sm"
            >
              <input
                ref={inputRef}
                id="danger-confirm"
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                className={inputClass(false)}
              />
            </Field>

            <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row">
              <button type="button" onClick={close} className={secondaryButtonClass}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={!matches}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-500/90 px-4 py-2 text-sm
                           font-semibold text-white transition-colors hover:bg-red-500
                           disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-500/90
                           focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
              >
                <Trash2 size={14} />
                Permanently delete account
              </button>
            </div>
          </form>
        )}
      </SectionBody>
    </SettingsSection>
  );
}