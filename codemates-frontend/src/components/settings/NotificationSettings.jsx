/**
 * NotificationSettings
 *
 * Choose which events reach you in the app and by email, and how often the
 * email digest arrives. Keeps its own draft; Save hands it to `onSave`.
 *
 * Props:
 *   values  {object}
 *     categories  { [categoryId]: { inApp: boolean, email: boolean } }
 *     digest      'NEVER' | 'DAILY' | 'WEEKLY'
 *   onSave  {fn}  (values)
 */

import { useState } from 'react';

import {
  Field,
  FormActions,
  SECTION_IDS,
  SectionBody,
  Select,
  SettingsSection,
  ToggleSwitch,
  isEqual,
} from './settingsShared';

// Each category groups one or more backend notification types.
export const NOTIFICATION_CATEGORIES = [
  {
    id: 'PROJECT_INVITATION',
    label: 'Project invitations',
    description: 'Someone invites you to join a project.',
  },
  {
    id: 'TEAM_CHANGES',
    label: 'Team changes',
    description: 'Members join or leave a project you’re on.',
  },
  {
    id: 'TASK_ASSIGNED',
    label: 'Task assignments',
    description: 'A task is assigned to you.',
  },
  {
    id: 'TASK_UPDATES',
    label: 'Task updates',
    description: 'Status changes and completed tasks on your projects.',
  },
  {
    id: 'MESSAGE_RECEIVED',
    label: 'Direct messages',
    description: 'You receive a new private message.',
  },
  {
    id: 'GITHUB_SYNC',
    label: 'GitHub sync',
    description: 'A repository sync finishes.',
  },
];

const DIGEST_OPTIONS = [
  { value: 'NEVER', label: 'Never' },
  { value: 'DAILY', label: 'Daily summary' },
  { value: 'WEEKLY', label: 'Weekly summary' },
];

export default function NotificationSettings({ values, onSave }) {
  const [draft, setDraft] = useState(values);
  const dirty = !isEqual(draft, values);

  const setChannel = (categoryId, channel) => (checked) =>
    setDraft((d) => ({
      ...d,
      categories: {
        ...d.categories,
        [categoryId]: { ...d.categories[categoryId], [channel]: checked },
      },
    }));

  const setAll = (channel, checked) =>
    setDraft((d) => ({
      ...d,
      categories: Object.fromEntries(
        Object.entries(d.categories).map(([id, c]) => [id, { ...c, [channel]: checked }])
      ),
    }));

  const allOn = (channel) => NOTIFICATION_CATEGORIES.every((c) => draft.categories[c.id]?.[channel]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(draft);
  };

  return (
    <SettingsSection
      id={SECTION_IDS.notifications}
      title="Notifications"
      description="Choose what you hear about, and where."
    >
      <form onSubmit={handleSubmit}>
        <SectionBody>
          <div>
            {/* Column headings (wide screens) with a "turn all on / off" switch each */}
            <div className="hidden grid-cols-[1fr_88px_88px] items-end gap-x-2 border-b border-[#1C1A38] pb-3 sm:grid">
              <span className="text-xs text-[#6B6890]">Notify me when…</span>
              {['inApp', 'email'].map((channel) => (
                <div key={channel} className="flex flex-col items-center gap-1.5">
                  <span id={`notif-all-${channel}`} className="text-xs font-medium text-[#8B88AE]">
                    {channel === 'inApp' ? 'In-app' : 'Email'}
                  </span>
                  <ToggleSwitch
                    checked={allOn(channel)}
                    onChange={(checked) => setAll(channel, checked)}
                    labelledBy={`notif-all-${channel}`}
                  />
                </div>
              ))}
            </div>

            <ul className="divide-y divide-[#1C1A38]">
              {NOTIFICATION_CATEGORIES.map((category) => {
                const state = draft.categories[category.id] ?? { inApp: false, email: false };

                return (
                  <li
                    key={category.id}
                    className="grid grid-cols-2 gap-y-3 py-3.5 sm:grid-cols-[1fr_88px_88px] sm:items-center sm:gap-x-2"
                  >
                    <div className="col-span-2 min-w-0 sm:col-span-1">
                      <p className="text-sm font-medium text-[#F5F5F5]">{category.label}</p>
                      <p className="mt-0.5 text-xs text-[#8B88AE]">{category.description}</p>
                    </div>

                    {[
                      ['inApp', 'In-app'],
                      ['email', 'Email'],
                    ].map(([channel, channelLabel]) => (
                      <div key={channel} className="flex items-center gap-3 sm:justify-center">
                        <span className="text-xs text-[#8B88AE] sm:hidden">{channelLabel}</span>
                        <ToggleSwitch
                          checked={state[channel]}
                          onChange={setChannel(category.id, channel)}
                          label={`${category.label}: ${channelLabel}`}
                        />
                      </div>
                    ))}
                  </li>
                );
              })}
            </ul>
          </div>

          <Field
            id="notif-digest"
            label="Email digest"
            hint="A single email summarising what you missed."
            className="sm:max-w-xs"
          >
            <Select
              id="notif-digest"
              value={draft.digest}
              onChange={(digest) => setDraft((d) => ({ ...d, digest }))}
              options={DIGEST_OPTIONS}
              aria-describedby="notif-digest-hint"
            />
          </Field>
        </SectionBody>

        <FormActions dirty={dirty} onCancel={() => setDraft(values)} saveLabel="Save notifications" />
      </form>
    </SettingsSection>
  );
}