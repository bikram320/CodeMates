/**
 * SkillsSection
 *
 * Skills are their own sub-resource on the backend (POST/DELETE
 * /api/users/me/skills), not part of the profile's bulk PUT — so unlike the
 * other sections here, there's no draft/Save: adding or removing a skill
 * calls the API immediately.
 *
 * Props:
 *   skills        {Array}   SkillResponse[] { id, skillName, proficiencyLevel, yearsOfExperience }
 *   onAdd         {fn}      ({ skillName, proficiencyLevel, yearsOfExperience }) → Promise
 *   onRemove      {fn}      (skillId) → Promise
 *   isAdding      {boolean}
 */

import { useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';

import {
  Field,
  Select,
  SectionBody,
  SettingsSection,
  inputClass,
  primaryButtonClass,
} from '../shared/formControls';

// ⚠️ Assumption: AddSkillRequest.proficiencyLevel is a free-text field capped
// at 20 characters with no @Pattern shown, so the allowed values aren't
// confirmed. This reuses the same four levels as experienceLevel — let me
// know the real set (e.g. from the Skill entity) if it differs.
const PROFICIENCY_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

const PROFICIENCY_LABEL = Object.fromEntries(PROFICIENCY_OPTIONS.map((o) => [o.value, o.label]));

const MAX_SKILL_NAME_LENGTH = 100;
const EMPTY_FORM = { skillName: '', proficiencyLevel: 'BEGINNER', yearsOfExperience: '0' };

export default function SkillsSection({ skills, onAdd, onRemove, isAdding }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);
  const nameInputRef = useRef(null);

  const set = (field) => (value) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const skillName = form.skillName.trim();

    if (!skillName) {
      setError('Enter a skill name.');
      nameInputRef.current?.focus();
      return;
    }
    if (skillName.length > MAX_SKILL_NAME_LENGTH) {
      setError(`Keep skill names under ${MAX_SKILL_NAME_LENGTH} characters.`);
      return;
    }
    if (skills.some((s) => s.skillName.toLowerCase() === skillName.toLowerCase())) {
      setError(`${skillName} is already on your list.`);
      return;
    }

    const years = Number(form.yearsOfExperience);
    try {
      await onAdd({
        skillName,
        proficiencyLevel: form.proficiencyLevel,
        yearsOfExperience: Number.isFinite(years) && years >= 0 ? Math.floor(years) : 0,
      });
      setForm(EMPTY_FORM);
      nameInputRef.current?.focus();
    } catch (err) {
      // e.g. "Skill already exists: x" from a race with another tab
      setError(err.message || 'Could not add that skill. Try again.');
    }
  };

  const handleRemove = async (skill) => {
    setRemovingId(skill.id);
    try {
      await onRemove(skill.id);
    } catch {
      // The row reappears on its own (the mutation rolls back); nothing else to do here.
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <SettingsSection
      id="profile-skills"
      title="Skills"
      description="Shown on your public profile and used to match you with projects."
    >
      <SectionBody>
        {skills.length === 0 ? (
          <p className="text-sm text-[#6B6890]">No skills yet. Add a few so teammates can find you.</p>
        ) : (
          <ul className="flex flex-wrap gap-2" aria-label="Your skills">
            {skills.map((skill) => (
              <li
                key={skill.id}
                className="flex items-center gap-2 rounded-lg border border-[#2E2A66] bg-[#1D1A40]/50 py-1.5 pl-3 pr-1.5"
              >
                <span className="text-sm text-[#F5F5F5]">{skill.skillName}</span>
                <span className="rounded bg-[#1D1A40] px-1.5 py-0.5 font-mono text-[10px] text-[#C9A8FF]">
                  {PROFICIENCY_LABEL[skill.proficiencyLevel] ?? skill.proficiencyLevel}
                </span>
                {skill.yearsOfExperience > 0 && (
                  <span className="text-xs text-[#6B6890]">
                    {skill.yearsOfExperience} {skill.yearsOfExperience === 1 ? 'yr' : 'yrs'}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(skill)}
                  disabled={removingId === skill.id}
                  aria-label={`Remove ${skill.skillName}`}
                  className="flex h-6 w-6 items-center justify-center rounded text-[#8B88AE] transition-colors
                             hover:bg-[#2E2A66] hover:text-[#F5F5F5] disabled:opacity-40
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field id="skill-name" label="Skill" className="flex-1">
            <input
              ref={nameInputRef}
              id="skill-name"
              type="text"
              value={form.skillName}
              onChange={(e) => set('skillName')(e.target.value)}
              placeholder="Enter skill"
              autoComplete="off"
              aria-invalid={Boolean(error)}
              className={inputClass(Boolean(error))}
            />
          </Field>

          <Field id="skill-proficiency" label="Level" className="sm:w-40">
            <Select
              id="skill-proficiency"
              value={form.proficiencyLevel}
              onChange={set('proficiencyLevel')}
              options={PROFICIENCY_OPTIONS}
            />
          </Field>

          <Field id="skill-years" label="Years" className="sm:w-24">
            <input
              id="skill-years"
              type="text"
              inputMode="numeric"
              value={form.yearsOfExperience}
              onChange={(e) => set('yearsOfExperience')(e.target.value.replace(/\D/g, '').slice(0, 2))}
              className={`${inputClass(false)} text-center`}
            />
          </Field>

          <button
            type="submit"
            disabled={isAdding}
            aria-busy={isAdding}
            className={`${primaryButtonClass} h-[42px] shrink-0`}
          >
            <Plus size={15} />
            {isAdding ? 'Adding…' : 'Add'}
          </button>
        </form>

        {error && (
          <p role="alert" className="text-xs text-red-300">
            {error}
          </p>
        )}
      </SectionBody>
    </SettingsSection>
  );
}