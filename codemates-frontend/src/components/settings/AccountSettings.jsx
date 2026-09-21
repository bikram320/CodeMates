/**
 * AccountSettings
 *
 * Sign-in email and password / security. The password form validates input
 * but does NOT change anything — it hands off to `onChangePassword()` (with no
 * password data) so the page can show a "demo only" message.
 *
 * Props:
 *   email                 {string}
 *   emailVerified         {boolean}
 *   authProvider          {'LOCAL'|'GITHUB'}  GitHub accounts have no password
 *   passwordLastChanged   {string}            Human-readable, e.g. "3 months ago"
 *   onUpdateEmail         {fn}  (email)
 *   onChangePassword      {fn}  ()  — nothing is changed
 *   onSignOutEverywhere   {fn}  ()  — nothing is signed out
 */

import { useRef, useState } from 'react';
import { Check, Eye, EyeOff, KeyRound, LogOut, Mail } from 'lucide-react';

import {
  DemoBadge,
  Field,
  FormActions,
  SECTION_IDS,
  SectionBody,
  SettingsSection,
  describedBy,
  inputClass,
  primaryButtonClass,
  secondaryButtonClass,
} from './settingsShared';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── Password input with show / hide ─────────────────────────────────────── */

function PasswordInput({ id, value, onChange, autoComplete, error, hint }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        spellCheck={false}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy(id, { error, hint })}
        className={`${inputClass(Boolean(error))} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md
                   text-[#6B6890] transition-colors hover:text-[#F5F5F5]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
      >
        {visible ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

function getStrength(password) {
  if (!password) return { score: 0, label: '' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return { score, label: ['Too weak', 'Weak', 'Okay', 'Good', 'Strong'][score] };
}

function StrengthMeter({ password }) {
  const { score, label } = getStrength(password);
  if (!password) return null;

  const color = score <= 1 ? 'bg-red-400' : score === 2 ? 'bg-amber-400' : 'bg-emerald-400';

  return (
    <div className="mt-2 flex items-center gap-3" aria-live="polite">
      <div className="flex flex-1 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full ${i <= score ? color : 'bg-[#2E2A66]'}`}
          />
        ))}
      </div>
      <span className="w-14 text-right text-xs text-[#8B88AE]">{label}</span>
    </div>
  );
}

function validatePassword({ current, next, confirm }) {
  const errors = {};
  if (!current) errors.current = 'Enter your current password.';

  if (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next)) {
    errors.next = 'Use at least 8 characters, with a letter and a number.';
  } else if (next === current) {
    errors.next = 'Choose a password different from your current one.';
  }

  if (confirm !== next) errors.confirm = 'The passwords don’t match.';
  return errors;
}

const EMPTY_PASSWORD_FORM = { current: '', next: '', confirm: '' };

/* ── Section ─────────────────────────────────────────────────────────────── */

export default function AccountSettings({
  email,
  emailVerified = true,
  authProvider = 'LOCAL',
  passwordLastChanged,
  onUpdateEmail,
  onChangePassword,
  onSignOutEverywhere,
}) {
  /* Email */
  const [draftEmail, setDraftEmail] = useState(email);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const emailInputRef = useRef(null);

  const normalizedEmail = draftEmail.trim().toLowerCase();
  const emailError = !EMAIL_RE.test(normalizedEmail) ? 'Enter a valid email address.' : '';
  const emailDirty = normalizedEmail !== email;

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (emailError) {
      setEmailSubmitted(true);
      emailInputRef.current?.focus();
      return;
    }
    onUpdateEmail(normalizedEmail);
    setDraftEmail(normalizedEmail);
    setEmailSubmitted(false);
  };

  /* Password */
  const [changingPassword, setChangingPassword] = useState(false);
  const [pw, setPw] = useState(EMPTY_PASSWORD_FORM);
  const [pwSubmitted, setPwSubmitted] = useState(false);
  const pwFormRef = useRef(null);

  const pwErrors = validatePassword(pw);
  const shownPw = pwSubmitted ? pwErrors : {};

  const closePasswordForm = () => {
    setChangingPassword(false);
    setPw(EMPTY_PASSWORD_FORM);
    setPwSubmitted(false);
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(pwErrors).length > 0) {
      setPwSubmitted(true);
      requestAnimationFrame(() => pwFormRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    onChangePassword(); // deliberately no password data leaves this component
    closePasswordForm();
  };

  const setPwField = (field) => (value) => setPw((p) => ({ ...p, [field]: value }));

  return (
    <SettingsSection
      id={SECTION_IDS.account}
      title="Account & security"
      description="Your sign-in details and how your account is protected."
    >
      {/* ── Email ───────────────────────────────────────────────────────── */}
      <form onSubmit={handleEmailSubmit} noValidate>
        <SectionBody>
          <Field
            id="account-email"
            label="Email address"
            error={emailSubmitted ? emailError : ''}
            hint="We’ll send a confirmation link to the new address before switching."
          >
            <div className="relative">
              <Mail size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6890]" />
              <input
                ref={emailInputRef}
                id="account-email"
                type="email"
                value={draftEmail}
                onChange={(e) => setDraftEmail(e.target.value)}
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                aria-invalid={Boolean(emailSubmitted && emailError)}
                aria-describedby={describedBy('account-email', {
                  error: emailSubmitted && emailError,
                  hint: true,
                })}
                className={`${inputClass(Boolean(emailSubmitted && emailError))} pl-9 pr-24`}
              />
              {!emailDirty && (
                <span
                  className={`absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 text-xs ${
                    emailVerified ? 'text-emerald-300' : 'text-amber-300'
                  }`}
                >
                  {emailVerified && <Check size={12} />}
                  {emailVerified ? 'Verified' : 'Unverified'}
                </span>
              )}
            </div>
          </Field>
        </SectionBody>

        <FormActions
          dirty={emailDirty}
          onCancel={() => {
            setDraftEmail(email);
            setEmailSubmitted(false);
          }}
          saveLabel="Update email"
        />
      </form>

      {/* ── Password & sessions ─────────────────────────────────────────── */}
      <div className="space-y-5 border-t border-[#1C1A38] p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Password</h3>
            <DemoBadge title="This form checks your input but doesn’t change your password yet" />
          </div>

          {authProvider === 'GITHUB' ? (
            <p className="mt-2 text-sm text-[#8B88AE]">
              You sign in with GitHub, so there&apos;s no CodeMates password to change.
            </p>
          ) : !changingPassword ? (
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-[#8B88AE]">
                {passwordLastChanged
                  ? `Last changed ${passwordLastChanged}.`
                  : 'Use a strong, unique password.'}
              </p>
              <button
                type="button"
                onClick={() => setChangingPassword(true)}
                className={secondaryButtonClass}
              >
                <KeyRound size={14} />
                Change password
              </button>
            </div>
          ) : (
            <form ref={pwFormRef} onSubmit={handlePasswordSubmit} noValidate className="mt-4 space-y-4 sm:max-w-md">
              <Field id="account-current-password" label="Current password" error={shownPw.current}>
                <PasswordInput
                  id="account-current-password"
                  value={pw.current}
                  onChange={setPwField('current')}
                  autoComplete="current-password"
                  error={shownPw.current}
                />
              </Field>

              <Field
                id="account-new-password"
                label="New password"
                error={shownPw.next}
                hint="At least 8 characters, with a letter and a number."
              >
                <PasswordInput
                  id="account-new-password"
                  value={pw.next}
                  onChange={setPwField('next')}
                  autoComplete="new-password"
                  error={shownPw.next}
                  hint
                />
                <StrengthMeter password={pw.next} />
              </Field>

              <Field id="account-confirm-password" label="Confirm new password" error={shownPw.confirm}>
                <PasswordInput
                  id="account-confirm-password"
                  value={pw.confirm}
                  onChange={setPwField('confirm')}
                  autoComplete="new-password"
                  error={shownPw.confirm}
                />
              </Field>

              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button type="button" onClick={closePasswordForm} className={secondaryButtonClass}>
                  Cancel
                </button>
                <button type="submit" className={primaryButtonClass}>
                  Update password
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="border-t border-[#1C1A38] pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-semibold text-[#F5F5F5]">Active sessions</h3>
                <DemoBadge title="This doesn’t sign anything out yet" />
              </div>
              <p className="mt-1 text-sm text-[#8B88AE]">
                Signed in on this device. Sign out everywhere if you think someone else has access.
              </p>
            </div>
            <button type="button" onClick={onSignOutEverywhere} className={`${secondaryButtonClass} shrink-0`}>
              <LogOut size={14} />
              Sign out of all devices
            </button>
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}