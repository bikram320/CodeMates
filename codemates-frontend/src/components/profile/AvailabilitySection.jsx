/**
 * AvailabilitySection
 *
 * Experience level, activity status and "open to collaborate".
 * PUTs only { experienceLevel, activityStatus, isOpenToCollaborate }.
 *
 * The option sets match UpdateProfileRequest's documented enums exactly:
 *   experienceLevel: BEGINNER | INTERMEDIATE | ADVANCED | EXPERT
 *   activityStatus:  ACTIVE | AWAY | BUSY | OFFLINE
 *
 * Props:
 *   profile  {object}  ProfileResponse
 *   onSave   {fn}      (partialData)
 */

import { useState } from 'react';

import {
  Field,
  FormActions,
  Select,
  SectionBody,
  SettingsSection,
  ToggleRow,
  isEqual,
} from '../shared/formControls';

const EXPERIENCE_OPTIONS = [
  { value: 'BEGINNER', label: 'Beginner' },
  { value: 'INTERMEDIATE', label: 'Intermediate' },
  { value: 'ADVANCED', label: 'Advanced' },
  { value: 'EXPERT', label: 'Expert' },
];

const ACTIVITY_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'BUSY', label: 'Busy' },
  { value: 'AWAY', label: 'Away' },
  { value: 'OFFLINE', label: 'Offline' },
];

function toDraft(profile) {
  return {
    experienceLevel: profile.experienceLevel ?? 'BEGINNER',
    activityStatus: profile.activityStatus ?? 'ACTIVE',
    isOpenToCollaborate: Boolean(profile.isOpenToCollaborate),
  };
}

export default function AvailabilitySection({ profile, onSave }) {
  const saved = toDraft(profile);
  const [draft, setDraft] = useState(saved);
  const [serverError, setServerError] = useState('');
  const dirty = !isEqual(draft, saved);

  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }));

  const handleCancel = () => {
    setDraft(saved);
    setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onSave(draft);
      setServerError('');
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <SettingsSection
      id="profile-availability"
      title="Experience & availability"
      description="Helps teammates know your level and whether you're free to collaborate."
    >
      <form onSubmit={handleSubmit}>
        <SectionBody>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="profile-experience" label="Experience level">
              <Select
                id="profile-experience"
                value={draft.experienceLevel}
                onChange={set('experienceLevel')}
                options={EXPERIENCE_OPTIONS}
              />
            </Field>

            <Field id="profile-activity-status" label="Status" hint="Shown next to your name in project teams.">
              <Select
                id="profile-activity-status"
                value={draft.activityStatus}
                onChange={set('activityStatus')}
                options={ACTIVITY_STATUS_OPTIONS}
              />
            </Field>
          </div>

          <ToggleRow
            id="profile-open-to-collaborate"
            label="Open to collaborate"
            description="Appear in developer discovery and get invited to new projects."
            checked={draft.isOpenToCollaborate}
            onChange={set('isOpenToCollaborate')}
          />

          {serverError && (
            <p role="alert" className="text-xs text-red-300">
              {serverError}
            </p>
          )}
        </SectionBody>

        <FormActions dirty={dirty} onCancel={handleCancel} saveLabel="Save availability" />
      </form>
    </SettingsSection>
  );
}