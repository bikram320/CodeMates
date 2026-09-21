/**
 * GeneralSettings
 *
 * Project name, description, type, tech stack and visibility. Keeps its own
 * draft; Save hands the cleaned values to `onSave`, Cancel discards edits.
 *
 * Props:
 *   values  {object}
 *     name, description, projectType, techStack string[], visibility ('PUBLIC'|'PRIVATE')
 *   onSave  {fn}  (values)
 */

import { useRef, useState } from 'react';
import { Globe, Lock } from 'lucide-react';

import {
  Field,
  FormActions,
  SectionBody,
  Select,
  SettingsSection,
  describedBy,
  inputClass,
  isEqual,
} from '../settings/settingsShared';
import { PROJECT_SECTION_IDS, TagEditor } from './projectSettingsShared';

const NAME_MIN = 2;
const NAME_MAX = 60;
const DESCRIPTION_MAX = 2000;

const PROJECT_TYPE_OPTIONS = [
  { value: 'OPEN_SOURCE', label: 'Open source' },
  { value: 'STARTUP', label: 'Startup / product' },
  { value: 'HACKATHON', label: 'Hackathon' },
  { value: 'ACADEMIC', label: 'Academic / student' },
  { value: 'PERSONAL', label: 'Personal / portfolio' },
];

const VISIBILITY_OPTIONS = [
  {
    value: 'PUBLIC',
    label: 'Public',
    icon: Globe,
    description: 'Listed in Discover projects. Anyone can view the project page.',
  },
  {
    value: 'PRIVATE',
    label: 'Private',
    icon: Lock,
    description: 'Hidden from discovery. Only members and invited developers can see it.',
  },
];

const TECH_SUGGESTIONS = ['React', 'Spring Boot', 'PostgreSQL', 'Docker', 'TypeScript', 'Redis', 'Kafka', 'Tailwind CSS'];

function validate(v) {
  const errors = {};
  const name = v.name.trim();

  if (name.length < NAME_MIN) errors.name = `Give your project a name (at least ${NAME_MIN} characters).`;
  else if (name.length > NAME_MAX) errors.name = `Keep the name under ${NAME_MAX} characters.`;

  if (v.description.length > DESCRIPTION_MAX) {
    errors.description = `Keep the description under ${DESCRIPTION_MAX} characters.`;
  }
  return errors;
}

export default function GeneralSettings({ values, onSave }) {
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
      requestAnimationFrame(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus());
      return;
    }
    const cleaned = {
      ...draft,
      name: draft.name.trim(),
      description: draft.description.trim(),
    };
    onSave(cleaned);
    setDraft(cleaned); // stay in step with what was saved so the form isn't "dirty"
    setSubmitted(false);
  };

  return (
    <SettingsSection
      id={PROJECT_SECTION_IDS.general}
      title="General"
      description="How your project is described to other developers."
    >
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <SectionBody>
          <Field id="project-name" label="Project name" error={shown.name}>
            <input
              id="project-name"
              type="text"
              value={draft.name}
              onChange={(e) => set('name')(e.target.value)}
              autoComplete="off"
              aria-invalid={Boolean(shown.name)}
              aria-describedby={describedBy('project-name', { error: shown.name })}
              className={inputClass(Boolean(shown.name))}
            />
          </Field>

          <Field id="project-description" label="Description" optional error={shown.description}>
            <textarea
              id="project-description"
              rows={5}
              value={draft.description}
              onChange={(e) => set('description')(e.target.value)}
              placeholder="What are you building, and who would be a good fit for the team?"
              aria-invalid={Boolean(shown.description)}
              aria-describedby={`project-description-count${shown.description ? ' project-description-error' : ''}`}
              className={`${inputClass(Boolean(shown.description))} resize-y`}
            />
            <p
              id="project-description-count"
              className={`mt-1.5 text-right font-mono text-[10px] ${
                draft.description.length > DESCRIPTION_MAX ? 'text-red-300' : 'text-[#6B6890]'
              }`}
            >
              {draft.description.length}/{DESCRIPTION_MAX}
            </p>
          </Field>

          <Field id="project-type" label="Project type" className="sm:max-w-xs">
            <Select
              id="project-type"
              value={draft.projectType}
              onChange={set('projectType')}
              options={PROJECT_TYPE_OPTIONS}
            />
          </Field>

          <TagEditor
            id="project-tech-stack"
            label="Tech stack"
            tags={draft.techStack}
            onChange={set('techStack')}
            noun="technology"
            placeholder="Add a technology and press Enter"
            suggestions={TECH_SUGGESTIONS}
          />

          {/* ── Visibility ────────────────────────────────────────────────── */}
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-[#F5F5F5]">Visibility</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {VISIBILITY_OPTIONS.map(({ value, label, icon: Icon, description }) => {
                const selected = draft.visibility === value;
                return (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors
                                focus-within:ring-2 focus-within:ring-[#6C7BFF]/60 ${
                                  selected
                                    ? 'border-[#6C7BFF] bg-[#6C7BFF]/10'
                                    : 'border-[#1C1A38] bg-[#1D1A40]/40 hover:border-[#2E2A66]'
                                }`}
                  >
                    <input
                      type="radio"
                      name="project-visibility"
                      value={value}
                      checked={selected}
                      onChange={() => set('visibility')(value)}
                      className="sr-only"
                    />
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        value === 'PUBLIC'
                          ? 'bg-[#6C7BFF]/10 text-[#8E9BFF]'
                          : 'bg-[#C9A8FF]/10 text-[#C9A8FF]'
                      }`}
                    >
                      <Icon size={15} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#F5F5F5]">{label}</span>
                      <span className="block text-xs leading-relaxed text-[#8B88AE]">{description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        </SectionBody>

        <FormActions dirty={dirty} onCancel={handleCancel} saveLabel="Save changes" />
      </form>
    </SettingsSection>
  );
}