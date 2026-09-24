/**
 * BasicInfoSection
 *
 * Editable identity fields: username, full name, bio, avatar URL.
 * PUTs only { username, fullName, bio, avatarUrl } — other profile fields
 * are untouched (see profileApi.updateProfile's partial-update contract).
 *
 * Props:
 *   profile  {object}  ProfileResponse
 *   onSave   {fn}      (partialData) — rejects with ProfileApiError on failure
 */

import { useRef, useState } from 'react';

import {
  Field,
  FormActions,
  SectionBody,
  SettingsSection,
  describedBy,
  inputClass,
  isEqual,
} from '../shared/formControls';

const BIO_MAX = 280;
const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{1,49}$/;

function toDraft(profile) {
  return {
    username: profile.username ?? '',
    fullName: profile.fullName ?? '',
    bio: profile.bio ?? '',
    avatarUrl: profile.avatarUrl ?? '',
  };
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
  } catch {
    return false;
  }
}

function validate(v) {
  const errors = {};
  if (!v.username.trim()) errors.username = 'Choose a username.';
  else if (!USERNAME_RE.test(v.username.trim())) {
    errors.username = 'Use 2–50 lowercase letters, numbers, "_" or "-", starting with a letter or number.';
  }
  if (!v.fullName.trim()) errors.fullName = 'Enter your name.';
  else if (v.fullName.trim().length > 100) errors.fullName = 'Keep your name under 100 characters.';
  if (v.bio.length > BIO_MAX) errors.bio = `Keep your bio under ${BIO_MAX} characters.`;
  if (v.avatarUrl && !isHttpUrl(v.avatarUrl)) errors.avatarUrl = 'Enter a full link starting with https://';
  return errors;
}

export default function BasicInfoSection({ profile, onSave }) {
  const saved = toDraft(profile);
  const [draft, setDraft] = useState(saved);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const formRef = useRef(null);

  const errors = validate(draft);
  const shown = submitted ? errors : {};
  const dirty = !isEqual(draft, saved);

  const set = (field) => (value) => {
    setDraft((d) => ({ ...d, [field]: value }));
    if (serverError) setServerError('');
  };

  const handleCancel = () => {
    setDraft(saved);
    setSubmitted(false);
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      setSubmitted(true);
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    try {
      await onSave({
        username: draft.username.trim(),
        fullName: draft.fullName.trim(),
        bio: draft.bio.trim(),
        avatarUrl: draft.avatarUrl.trim(),
      });
      setSubmitted(false);
      setServerError('');
    } catch (err) {
      // e.g. "Username already taken: x" — surfaced inline, and the draft is kept so the user can fix it.
      setServerError(err.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <SettingsSection id="profile-basic-info" title="Basic info" description="Your name, username and bio.">
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <SectionBody>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="profile-fullName" label="Full name" error={shown.fullName}>
              <input
                id="profile-fullName"
                type="text"
                value={draft.fullName}
                onChange={(e) => set('fullName')(e.target.value)}
                autoComplete="name"
                aria-invalid={Boolean(shown.fullName)}
                aria-describedby={describedBy('profile-fullName', { error: shown.fullName })}
                className={inputClass(Boolean(shown.fullName))}
              />
            </Field>

            <Field
              id="profile-username"
              label="Username"
              error={shown.username || (serverError.toLowerCase().includes('username') ? serverError : '')}
              hint="Lowercase letters, numbers, “_” and “-”."
            >
              <div
                className={`flex overflow-hidden rounded-lg border bg-[#1D1A40]/50 focus-within:ring-2 ${
                  shown.username || serverError.toLowerCase().includes('username')
                    ? 'border-red-400/70 focus-within:border-red-400 focus-within:ring-red-400/20'
                    : 'border-[#2E2A66] hover:border-[#3A3580] focus-within:border-[#6C7BFF] focus-within:ring-[#6C7BFF]/30'
                }`}
              >
                <span className="flex items-center border-r border-[#2E2A66] bg-[#1D1A40] px-3 font-mono text-sm text-[#6B6890]">
                  @
                </span>
                <input
                  id="profile-username"
                  type="text"
                  value={draft.username}
                  onChange={(e) => set('username')(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  autoComplete="username"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={Boolean(shown.username)}
                  className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-base text-[#F5F5F5]
                             focus:outline-none sm:text-sm"
                />
              </div>
            </Field>
          </div>

          <Field id="profile-bio" label="Bio" optional error={shown.bio}>
            <textarea
              id="profile-bio"
              rows={4}
              value={draft.bio}
              onChange={(e) => set('bio')(e.target.value)}
              placeholder="What do you build, and what are you looking to work on?"
              aria-invalid={Boolean(shown.bio)}
              className={`${inputClass(Boolean(shown.bio))} resize-y`}
            />
            <p
              className={`mt-1.5 text-right font-mono text-[10px] ${
                draft.bio.length > BIO_MAX ? 'text-red-300' : 'text-[#6B6890]'
              }`}
            >
              {draft.bio.length}/{BIO_MAX}
            </p>
          </Field>

          <Field
            id="profile-avatarUrl"
            label="Avatar URL"
            optional
            error={shown.avatarUrl}
            hint="Paste a link to an image. There's no upload yet."
          >
            <input
              id="profile-avatarUrl"
              type="url"
              value={draft.avatarUrl}
              onChange={(e) => set('avatarUrl')(e.target.value)}
              placeholder="https://example.com/your-photo.jpg"
              autoComplete="off"
              spellCheck={false}
              aria-invalid={Boolean(shown.avatarUrl)}
              className={inputClass(Boolean(shown.avatarUrl))}
            />
          </Field>

          {serverError && !serverError.toLowerCase().includes('username') && (
            <p role="alert" className="text-xs text-red-300">
              {serverError}
            </p>
          )}
        </SectionBody>

        <FormActions dirty={dirty} onCancel={handleCancel} saveLabel="Save basic info" />
      </form>
    </SettingsSection>
  );
}