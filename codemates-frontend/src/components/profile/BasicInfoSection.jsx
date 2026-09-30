
import { useRef, useState } from 'react';

import {
  EditButton,
  Field,
  FormActions,
  InfoGrid,
  InfoItem,
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
  const [editing, setEditing] = useState(false);
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

  const startEditing = () => {
    setDraft(saved);
    setEditing(true);
  };

  const handleCancel = () => {
    setDraft(saved);
    setSubmitted(false);
    setServerError('');
    setEditing(false);
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
      setEditing(false);
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Try again.');
    }
  };

  const usernameError =
    shown.username || (serverError.toLowerCase().includes('username') ? serverError : '');

  return (
    <SettingsSection
      id="profile-basic-info"
      title="Basic info"
      action={!editing && <EditButton onClick={startEditing} aria-label="Edit basic info" />}
    >
      {!editing ? (
        <SectionBody>
          <InfoGrid>
            <InfoItem label="Full name" value={profile.fullName} />
            <InfoItem label="Username" value={profile.username && `@${profile.username}`} mono />
            <InfoItem label="Avatar URL" value={profile.avatarUrl} />
            <InfoItem label="Bio" value={profile.bio} className="sm:col-span-3" />
          </InfoGrid>
        </SectionBody>
      ) : (
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
                error={usernameError}
                hint="Lowercase letters, numbers, “_” and “-”."
              >
                <div
                  className={`flex overflow-hidden rounded-lg border bg-white focus-within:ring-2 ${
                    usernameError
                      ? 'border-red-400 focus-within:border-red-500 focus-within:ring-red-400/20'
                      : 'border-[#D9DCE1] hover:border-[#B8BDC6] focus-within:border-[#6C7BFF] focus-within:ring-[#6C7BFF]/30'
                  }`}
                >
                  <span className="flex items-center border-r border-[#D9DCE1] bg-[#F4F5F7] px-3 font-mono text-sm text-[#6B7280]">
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
                    className="min-w-0 flex-1 bg-transparent px-3 py-2.5 font-mono text-base text-[#16171D]
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
                  draft.bio.length > BIO_MAX ? 'text-red-600' : 'text-[#9CA3AF]'
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
                placeholder="Enter avatar URL"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(shown.avatarUrl)}
                className={inputClass(Boolean(shown.avatarUrl))}
              />
            </Field>

            {serverError && !serverError.toLowerCase().includes('username') && (
              <p role="alert" className="text-xs text-red-600">
                {serverError}
              </p>
            )}
          </SectionBody>

          <FormActions
            dirty={dirty}
            onCancel={handleCancel}
            saveLabel="Save basic info"
            alwaysAllowCancel
          />
        </form>
      )}
    </SettingsSection>
  );
}