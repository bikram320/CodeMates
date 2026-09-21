/**
 * ProfileSettings
 *
 * Public profile: name, username, bio, experience, availability, skills and
 * GitHub / LinkedIn / portfolio links. Keeps its own draft; Save hands the
 * cleaned values to `onSave`, Cancel throws the edits away.
 *
 * Props:
 *   values     {object}  Saved profile
 *     fullName, username, bio, experienceLevel,
 *     isOpenToCollaborate, availability ('AVAILABLE'|'BUSY'|'AWAY'),
 *     skills string[], githubUsername, linkedinUrl, portfolioUrl
 *   avatarUrl  {string}  Optional, display only (photo upload isn't built)
 *   onSave     {fn}      (values) — parent updates `values`
 */

import { useRef, useState } from 'react';
import { Globe, Link2, Plus, X } from 'lucide-react';

import {
  Field,
  FormActions,
  SECTION_IDS,
  SectionBody,
  Select,
  SettingsSection,
  ToggleRow,
  describedBy,
  inputClass,
  isEqual,
  secondaryButtonClass,
} from './settingsShared';

// The API stores these as free text — confirm the agreed value set with the backend.
const EXPERIENCE_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner (0–2 years)' },
  { value: 'INTERMEDIATE', label: 'Intermediate (2–5 years)' },
  { value: 'ADVANCED', label: 'Advanced (5+ years)' },
];

const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'AWAY', label: 'Away' },
];

const SUGGESTED_SKILLS = ['TypeScript', 'Docker', 'Spring Boot', 'PostgreSQL', 'Python', 'Figma', 'Go'];

const BIO_MAX = 280;
const MAX_SKILLS = 15;
const MAX_SKILL_LENGTH = 30;

const USERNAME_RE = /^[a-z0-9][a-z0-9_-]{1,29}$/;
const GITHUB_RE = /^[a-z\d]+(?:-[a-z\d]+)*$/i;

function parseUrl(value) {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.hostname.includes('.') ? url : null;
  } catch {
    return null;
  }
}

function validate(v) {
  const errors = {};

  if (!v.fullName.trim()) errors.fullName = 'Enter your name.';
  else if (v.fullName.trim().length > 60) errors.fullName = 'Keep your name under 60 characters.';

  if (!USERNAME_RE.test(v.username)) {
    errors.username =
      'Use 2–30 lowercase letters, numbers, "_" or "-", starting with a letter or number.';
  }

  if (v.bio.length > BIO_MAX) errors.bio = `Keep your bio under ${BIO_MAX} characters.`;

  if (v.githubUsername && (!GITHUB_RE.test(v.githubUsername) || v.githubUsername.length > 39)) {
    errors.githubUsername = 'That doesn’t look like a GitHub username.';
  }

  if (v.linkedinUrl) {
    const url = parseUrl(v.linkedinUrl);
    const onLinkedIn = url && (url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com'));
    if (!onLinkedIn) errors.linkedinUrl = 'Enter a LinkedIn link, like https://www.linkedin.com/in/your-name';
  }

  if (v.portfolioUrl && !parseUrl(v.portfolioUrl)) {
    errors.portfolioUrl = 'Enter a full link starting with https://';
  }

  return errors;
}

const getInitials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

/* ── Skills editor ───────────────────────────────────────────────────────── */

function SkillsEditor({ skills, onChange }) {
  const [input, setInput] = useState('');
  const [problem, setProblem] = useState('');

  const addSkills = (raw) => {
    const candidates = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (candidates.length === 0) return;

    let next = [...skills];
    let message = '';

    for (const name of candidates) {
      if (name.length > MAX_SKILL_LENGTH) {
        message = `Skill names can be up to ${MAX_SKILL_LENGTH} characters.`;
      } else if (next.some((s) => s.toLowerCase() === name.toLowerCase())) {
        message = `${name} is already on your list.`;
      } else if (next.length >= MAX_SKILLS) {
        message = `You can list up to ${MAX_SKILLS} skills.`;
        break;
      } else {
        next.push(name);
      }
    }

    onChange(next);
    setProblem(message);
    if (!message) setInput('');
  };

  const removeSkill = (name) => {
    onChange(skills.filter((s) => s !== name));
    setProblem('');
  };

  const suggestions = SUGGESTED_SKILLS.filter(
    (s) => !skills.some((existing) => existing.toLowerCase() === s.toLowerCase())
  ).slice(0, 5);

  return (
    <div>
      <label htmlFor="profile-skill-input" className="mb-1.5 block text-sm font-medium text-[#F5F5F5]">
        Skills
      </label>

      {skills.length > 0 ? (
        <ul className="mb-3 flex flex-wrap gap-1.5" aria-label="Your skills">
          {skills.map((skill) => (
            <li
              key={skill}
              className="inline-flex items-center gap-1 rounded-md bg-[#1D1A40] py-0.5 pl-2 pr-1 font-mono text-[11px] text-[#C9A8FF]"
            >
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                aria-label={`Remove ${skill}`}
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
        <p className="mb-3 text-xs text-[#6B6890]">No skills yet. Add a few so teammates can find you.</p>
      )}

      <div className="flex gap-2">
        <input
          id="profile-skill-input"
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (problem) setProblem('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault(); // Enter must not submit the form
              addSkills(input);
            }
          }}
          placeholder="Add a skill and press Enter"
          autoComplete="off"
          aria-describedby="profile-skill-hint"
          className={inputClass(Boolean(problem))}
        />
        <button
          type="button"
          onClick={() => addSkills(input)}
          disabled={!input.trim()}
          aria-label="Add skill"
          className={`${secondaryButtonClass} shrink-0 px-3`}
        >
          <Plus size={15} />
        </button>
      </div>

      <p
        id="profile-skill-hint"
        className={`mt-1.5 text-xs ${problem ? 'text-red-300' : 'text-[#6B6890]'}`}
      >
        {problem || `${skills.length}/${MAX_SKILLS} skills. Separate several with commas.`}
      </p>

      {suggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-[#6B6890]">Suggested:</span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => addSkills(s)}
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

/* ── Prefixed input (github.com/…) ───────────────────────────────────────── */

function PrefixInput({ id, prefix, value, onChange, error, placeholder, hint }) {
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
        aria-describedby={describedBy(id, { error, hint })}
        className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-base text-[#F5F5F5] placeholder:text-[#6B6890]
                   focus:outline-none sm:text-sm"
      />
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────────────────────── */

export default function ProfileSettings({ values, avatarUrl, onSave }) {
  const [draft, setDraft] = useState(values);
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef(null);

  const errors = validate(draft);
  const shown = submitted ? errors : {};
  const dirty = !isEqual(draft, values);

  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }));

  const handleCancel = () => {
    setDraft(values);
    setSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      setSubmitted(true);
      // Move focus to the first invalid field once errors have rendered.
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    const cleaned = {
      ...draft,
      fullName: draft.fullName.trim(),
      bio: draft.bio.trim(),
      githubUsername: draft.githubUsername.trim(),
      linkedinUrl: draft.linkedinUrl.trim(),
      portfolioUrl: draft.portfolioUrl.trim(),
    };
    onSave(cleaned);
    setDraft(cleaned); // keep the draft in step with what was saved so it isn't "dirty"
    setSubmitted(false);
  };

  return (
    <SettingsSection
      id={SECTION_IDS.profile}
      title="Profile"
      description="This is what other developers see on your profile and in project teams."
    >
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <SectionBody>
          {/* ── Avatar ────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br
                           from-[#6C7BFF] to-[#C9A8FF] text-xl font-bold text-[#0A0918]"
              >
                {getInitials(draft.fullName) || '?'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-[#F5F5F5]">{draft.fullName || 'Your name'}</p>
              <p className="truncate font-mono text-xs text-[#8B88AE]">@{draft.username || 'username'}</p>
              <p className="mt-1 text-xs text-[#6B6890]">Photo upload isn&apos;t available yet.</p>
            </div>
          </div>

          {/* ── Identity ──────────────────────────────────────────────────── */}
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
              error={shown.username}
              hint="Lowercase letters, numbers, “_” and “-”."
            >
              <div
                className={`flex overflow-hidden rounded-lg border bg-[#1D1A40]/50 focus-within:ring-2 ${
                  shown.username
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
                  aria-describedby={describedBy('profile-username', {
                    error: shown.username,
                    hint: true,
                  })}
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
              aria-describedby={`profile-bio-count${shown.bio ? ' profile-bio-error' : ''}`}
              className={`${inputClass(Boolean(shown.bio))} resize-y`}
            />
            <p
              id="profile-bio-count"
              className={`mt-1.5 text-right font-mono text-[10px] ${
                draft.bio.length > BIO_MAX ? 'text-red-300' : 'text-[#6B6890]'
              }`}
            >
              {draft.bio.length}/{BIO_MAX}
            </p>
          </Field>

          <Field id="profile-experience" label="Experience level" className="sm:max-w-xs">
            <Select
              id="profile-experience"
              value={draft.experienceLevel}
              onChange={set('experienceLevel')}
              options={EXPERIENCE_OPTIONS}
            />
          </Field>

          {/* ── Availability ──────────────────────────────────────────────── */}
          <div className="space-y-4 rounded-xl border border-[#1C1A38] bg-[#0F0E24]/60 p-4">
            <p className="text-sm font-semibold text-[#F5F5F5]">Availability</p>

            <ToggleRow
              id="profile-open"
              label="Open to collaborate"
              description="Appear in developer discovery and get invited to new projects."
              checked={draft.isOpenToCollaborate}
              onChange={set('isOpenToCollaborate')}
            />

            <Field
              id="profile-availability"
              label="Status"
              hint="Shown next to your name in project teams."
              className="sm:max-w-xs"
            >
              <Select
                id="profile-availability"
                value={draft.availability}
                onChange={set('availability')}
                options={AVAILABILITY_OPTIONS}
                aria-describedby="profile-availability-hint"
              />
            </Field>
          </div>

          {/* ── Skills ────────────────────────────────────────────────────── */}
          <SkillsEditor skills={draft.skills} onChange={set('skills')} />

          {/* ── Links ─────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            <p className="text-sm font-semibold text-[#F5F5F5]">Links</p>

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
          </div>
        </SectionBody>

        <FormActions dirty={dirty} onCancel={handleCancel} saveLabel="Save profile" />
      </form>
    </SettingsSection>
  );
}