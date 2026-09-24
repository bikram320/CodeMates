/**
 * LinksSection
 *
 * Editable external links: portfolio, LinkedIn, GitHub username.
 * PUTs only { portfolioUrl, linkedinUrl, githubUsername }.
 *
 * Props:
 *   profile  {object}  ProfileResponse
 *   onSave   {fn}      (partialData) — rejects with ProfileApiError on failure
 */

import { useRef, useState } from 'react';
import { Globe, Link2 } from 'lucide-react';

import {
  Field,
  FormActions,
  SectionBody,
  SettingsSection,
  describedBy,
  inputClass,
  isEqual,
} from '../shared/formControls';

const GITHUB_USERNAME_RE = /^[a-z\d]+(?:-[a-z\d]+)*$/i;

function toDraft(profile) {
  return {
    portfolioUrl: profile.portfolioUrl ?? '',
    linkedinUrl: profile.linkedinUrl ?? '',
    githubUsername: profile.githubUsername ?? '',
  };
}

function isHttpUrl(value, requiredHost) {
  try {
    const url = new URL(value);
    const okProtocol = ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.');
    if (!requiredHost) return okProtocol;
    return okProtocol && (url.hostname === requiredHost || url.hostname.endsWith(`.${requiredHost}`));
  } catch {
    return false;
  }
}

function validate(v) {
  const errors = {};
  if (v.portfolioUrl && !isHttpUrl(v.portfolioUrl)) {
    errors.portfolioUrl = 'Enter a full link starting with https://';
  }
  if (v.linkedinUrl && !isHttpUrl(v.linkedinUrl, 'linkedin.com')) {
    errors.linkedinUrl = 'Enter a LinkedIn link, like https://www.linkedin.com/in/your-name';
  }
  if (v.githubUsername && (!GITHUB_USERNAME_RE.test(v.githubUsername) || v.githubUsername.length > 39)) {
    errors.githubUsername = 'That doesn’t look like a GitHub username.';
  }
  return errors;
}

function PrefixInput({ id, prefix, value, onChange, error, placeholder }) {
  return (
    <div
      className={`flex overflow-hidden rounded-lg border bg-[#1D1A40]/50 focus-within:ring-2 ${
        error
          ? 'border-red-400/70 focus-within:border-red-400 focus-within:ring-red-400/20'
          : 'border-[#2E2A66] hover:border-[#3A3580] focus-within:border-[#6C7BFF] focus-within:ring-[#6C7BFF]/30'
      }`}
    >
      <span className="flex items-center border-r border-[#2E2A66] bg-[#1D1A40] px-3 font-mono text-xs text-[#6B6890]">
        {prefix}
      </span>
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        autoCapitalize="none"
        spellCheck={false}
        aria-invalid={Boolean(error)}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-[#F5F5F5] placeholder:text-[#6B6890]
                   focus:outline-none sm:text-sm"
      />
    </div>
  );
}

export default function LinksSection({ profile, onSave }) {
  const saved = toDraft(profile);
  const [draft, setDraft] = useState(saved);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');
  const formRef = useRef(null);

  const errors = validate(draft);
  const shown = submitted ? errors : {};
  const dirty = !isEqual(draft, saved);

  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }));

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
        portfolioUrl: draft.portfolioUrl.trim(),
        linkedinUrl: draft.linkedinUrl.trim(),
        githubUsername: draft.githubUsername.trim(),
      });
      setSubmitted(false);
      setServerError('');
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <SettingsSection id="profile-links" title="Links" description="Shown on your public profile.">
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <SectionBody>
          <Field id="profile-portfolio" label="Portfolio" optional error={shown.portfolioUrl}>
            <div className="relative">
              <Globe size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6890]" />
              <input
                id="profile-portfolio"
                type="url"
                value={draft.portfolioUrl}
                onChange={(e) => set('portfolioUrl')(e.target.value)}
                placeholder="https://your-site.dev"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(shown.portfolioUrl)}
                aria-describedby={describedBy('profile-portfolio', { error: shown.portfolioUrl })}
                className={`${inputClass(Boolean(shown.portfolioUrl))} pl-9`}
              />
            </div>
          </Field>

          <Field id="profile-linkedin" label="LinkedIn" optional error={shown.linkedinUrl}>
            <div className="relative">
              <Link2 size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6890]" />
              <input
                id="profile-linkedin"
                type="url"
                value={draft.linkedinUrl}
                onChange={(e) => set('linkedinUrl')(e.target.value)}
                placeholder="https://www.linkedin.com/in/your-name"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(shown.linkedinUrl)}
                aria-describedby={describedBy('profile-linkedin', { error: shown.linkedinUrl })}
                className={`${inputClass(Boolean(shown.linkedinUrl))} pl-9`}
              />
            </div>
          </Field>

          <Field id="profile-github" label="GitHub" optional error={shown.githubUsername}>
            <PrefixInput
              id="profile-github"
              prefix="github.com/"
              value={draft.githubUsername}
              onChange={(v) =>
                set('githubUsername')(v.replace(/^https?:\/\/(www\.)?github\.com\//i, '').replace(/^@/, '').replace(/\s/g, ''))
              }
              error={shown.githubUsername}
              placeholder="username"
            />
          </Field>

          {serverError && (
            <p role="alert" className="text-xs text-red-300">
              {serverError}
            </p>
          )}
        </SectionBody>

        <FormActions dirty={dirty} onCancel={handleCancel} saveLabel="Save links" />
      </form>
    </SettingsSection>
  );
}