/**
 * TeamSettings
 *
 * Team size limit, member-management rules and invitation settings.
 * Keeps its own draft; Save hands it to `onSave`.
 *
 * Props:
 *   values        {object}
 *     maxMembers        number
 *     whoCanInvite      'LEADERS' | 'LEADERS_REVIEWERS'
 *     defaultRole       'CONTRIBUTOR' | 'REVIEWER'
 *     allowLeaving      boolean   members may leave on their own
 *     invitationsEnabled boolean  pause / resume inviting
 *     openToNewMembers  boolean   listed in Discover projects with open roles
 *   memberCount   {number}   Current members — the size limit can't go below this
 *   pendingCount  {number}   Outstanding invitations (informational)
 *   onSave        {fn}       (values)
 */

import { useState } from 'react';
import { Clock, Minus, Plus } from 'lucide-react';

import {
  Field,
  FormActions,
  SectionBody,
  Select,
  SettingsSection,
  ToggleRow,
  describedBy,
  inputClass,
  isEqual,
  secondaryButtonClass,
} from '../settings/settingsShared';
import { PROJECT_SECTION_IDS } from './projectSettingsShared';

const MAX_TEAM_SIZE = 50;

const WHO_CAN_INVITE_OPTIONS = [
  { value: 'LEADERS', label: 'Leaders only' },
  { value: 'LEADERS_REVIEWERS', label: 'Leaders and reviewers' },
];

const DEFAULT_ROLE_OPTIONS = [
  { value: 'CONTRIBUTOR', label: 'Contributor' },
  { value: 'REVIEWER', label: 'Reviewer' },
];

export default function TeamSettings({ values, memberCount = 1, pendingCount = 0, onSave }) {
  const [draft, setDraft] = useState(values);
  const [submitted, setSubmitted] = useState(false);

  const dirty = !isEqual(draft, values);
  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }));

  const size = draft.maxMembers;
  const sizeError = !Number.isInteger(size)
    ? 'Enter a whole number.'
    : size < memberCount
    ? `The limit can’t be lower than your current ${memberCount} ${memberCount === 1 ? 'member' : 'members'}.`
    : size > MAX_TEAM_SIZE
    ? `Teams can have up to ${MAX_TEAM_SIZE} members.`
    : '';
  const shownSizeError = submitted ? sizeError : '';

  const step = (delta) =>
    setDraft((d) => {
      const current = Number.isInteger(d.maxMembers) ? d.maxMembers : memberCount;
      return { ...d, maxMembers: Math.min(MAX_TEAM_SIZE, Math.max(memberCount, current + delta)) };
    });

  const handleCancel = () => {
    setDraft(values);
    setSubmitted(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sizeError) {
      setSubmitted(true);
      document.getElementById('team-max-members')?.focus();
      return;
    }
    onSave(draft);
    setSubmitted(false);
  };

  const spotsLeft = Number.isInteger(size) ? Math.max(0, size - memberCount) : null;

  return (
    <SettingsSection
      id={PROJECT_SECTION_IDS.team}
      title="Team"
      description="How big the team can get, and who can bring people in."
    >
      <form onSubmit={handleSubmit} noValidate>
        <SectionBody>
          {/* ── Team size ─────────────────────────────────────────────────── */}
          <Field
            id="team-max-members"
            label="Maximum team size"
            error={shownSizeError}
            hint={`${memberCount} ${memberCount === 1 ? 'member' : 'members'}${
              pendingCount > 0 ? ` and ${pendingCount} pending ${pendingCount === 1 ? 'invite' : 'invites'}` : ''
            }${spotsLeft !== null ? ` · ${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left` : ''}`}
          >
            <div className="flex max-w-[11rem] items-stretch gap-2">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={Number.isInteger(size) && size <= memberCount}
                aria-label="Decrease maximum team size"
                className={`${secondaryButtonClass} px-3`}
              >
                <Minus size={14} />
              </button>
              <input
                id="team-max-members"
                type="text"
                inputMode="numeric"
                value={Number.isInteger(size) ? String(size) : ''}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 3);
                  set('maxMembers')(digits === '' ? '' : Number(digits));
                }}
                aria-invalid={Boolean(shownSizeError)}
                aria-describedby={describedBy('team-max-members', { error: shownSizeError, hint: true })}
                className={`${inputClass(Boolean(shownSizeError))} min-w-0 text-center font-mono`}
              />
              <button
                type="button"
                onClick={() => step(1)}
                disabled={Number.isInteger(size) && size >= MAX_TEAM_SIZE}
                aria-label="Increase maximum team size"
                className={`${secondaryButtonClass} px-3`}
              >
                <Plus size={14} />
              </button>
            </div>
          </Field>

          {/* ── Member management ─────────────────────────────────────────── */}
          <div className="space-y-4 rounded-xl border border-[#1C1A38] bg-[#0F0E24]/60 p-4">
            <p className="text-sm font-semibold text-[#F5F5F5]">Member management</p>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                id="team-who-can-invite"
                label="Who can invite members"
                hint="Only leaders can change roles or remove members."
              >
                <Select
                  id="team-who-can-invite"
                  value={draft.whoCanInvite}
                  onChange={set('whoCanInvite')}
                  options={WHO_CAN_INVITE_OPTIONS}
                  aria-describedby="team-who-can-invite-hint"
                />
              </Field>

              <Field
                id="team-default-role"
                label="Default role for new members"
                hint="Used when an invite doesn’t specify a role."
              >
                <Select
                  id="team-default-role"
                  value={draft.defaultRole}
                  onChange={set('defaultRole')}
                  options={DEFAULT_ROLE_OPTIONS}
                  aria-describedby="team-default-role-hint"
                />
              </Field>
            </div>

            <ToggleRow
              id="team-allow-leaving"
              label="Members can leave on their own"
              description="Turn off to make members ask a leader before leaving."
              checked={draft.allowLeaving}
              onChange={set('allowLeaving')}
            />
          </div>

          {/* ── Invitations ───────────────────────────────────────────────── */}
          <div className="space-y-4 rounded-xl border border-[#1C1A38] bg-[#0F0E24]/60 p-4">
            <p className="text-sm font-semibold text-[#F5F5F5]">Invitations</p>

            <ToggleRow
              id="team-invitations-enabled"
              label="Allow new invitations"
              description="Turn off to pause inviting without changing your team size limit."
              checked={draft.invitationsEnabled}
              onChange={set('invitationsEnabled')}
            />

            <ToggleRow
              id="team-open-to-new"
              label="Open to new members"
              description="Show this project in Discover projects with its open roles."
              checked={draft.openToNewMembers}
              onChange={set('openToNewMembers')}
            />

            <div className="flex items-start gap-2.5 rounded-lg bg-[#1D1A40]/50 px-3 py-2.5">
              <Clock size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-[#8B88AE]" />
              <p className="text-xs leading-relaxed text-[#8B88AE]">
                <span className="font-medium text-[#F5F5F5]">Invitations expire after 7 days.</span>{' '}
                This is set by CodeMates and can&apos;t be changed per project.
              </p>
            </div>
          </div>
        </SectionBody>

        <FormActions dirty={dirty} onCancel={handleCancel} saveLabel="Save team settings" />
      </form>
    </SettingsSection>
  );
}