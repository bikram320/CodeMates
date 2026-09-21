/**
 * PreferencesSettings
 *
 * Basic app preferences: language, time zone, time format, start page and a
 * couple of display options. "Restore defaults" only changes the draft — the
 * user still has to Save.
 *
 * Props:
 *   values  {object}  { language, timezone, timeFormat, startPage, compactCards, reduceMotion }
 *   onSave  {fn}      (values)
 */

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

import {
  Field,
  FormActions,
  SECTION_IDS,
  SectionBody,
  Select,
  SettingsSection,
  ToggleRow,
  isEqual,
} from './settingsShared';

export const DEFAULT_PREFERENCES = {
  theme: 'DARK',
  language: 'en-US',
  timezone: 'UTC',
  timeFormat: '24H',
  startPage: 'DASHBOARD',
  compactCards: false,
  reduceMotion: false,
};

const THEME_OPTIONS = [
  { value: 'DARK', label: 'Dark' },
  { value: 'LIGHT', label: 'Light (coming soon)', disabled: true },
  { value: 'SYSTEM', label: 'Match system (coming soon)', disabled: true },
];

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'en-GB', label: 'English (UK)' },
  { value: 'es', label: 'Español' },
  { value: 'de', label: 'Deutsch' },
];

const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: '(UTC+00:00) UTC' },
  { value: 'Europe/London', label: '(UTC+00:00) London' },
  { value: 'Europe/Berlin', label: '(UTC+01:00) Berlin' },
  { value: 'Asia/Kolkata', label: '(UTC+05:30) India' },
  { value: 'Asia/Tokyo', label: '(UTC+09:00) Tokyo' },
  { value: 'America/New_York', label: '(UTC−05:00) New York' },
  { value: 'America/Los_Angeles', label: '(UTC−08:00) Los Angeles' },
];

const TIME_FORMAT_OPTIONS = [
  { value: '24H', label: '24-hour (14:30)' },
  { value: '12H', label: '12-hour (2:30 PM)' },
];

const START_PAGE_OPTIONS = [
  { value: 'DASHBOARD', label: 'Dashboard' },
  { value: 'DISCOVER_PROJECTS', label: 'Discover projects' },
  { value: 'DISCOVER_DEVELOPERS', label: 'Discover developers' },
];

export default function PreferenceSettings({ values, onSave }) {
  const [draft, setDraft] = useState(values);
  const dirty = !isEqual(draft, values);
  const isDefault = isEqual(draft, DEFAULT_PREFERENCES);

  const set = (field) => (value) => setDraft((d) => ({ ...d, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(draft);
  };

  return (
    <SettingsSection
      id={SECTION_IDS.preferences}
      title="Preferences"
      description="How CodeMates looks and behaves for you."
    >
      <form onSubmit={handleSubmit}>
        <SectionBody>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="pref-theme" label="Theme" hint="CodeMates is dark-only for now.">
              <Select
                id="pref-theme"
                value={draft.theme}
                onChange={set('theme')}
                options={THEME_OPTIONS}
                aria-describedby="pref-theme-hint"
              />
            </Field>

            <Field id="pref-language" label="Language">
              <Select
                id="pref-language"
                value={draft.language}
                onChange={set('language')}
                options={LANGUAGE_OPTIONS}
              />
            </Field>

            <Field id="pref-timezone" label="Time zone">
              <Select
                id="pref-timezone"
                value={draft.timezone}
                onChange={set('timezone')}
                options={TIMEZONE_OPTIONS}
              />
            </Field>

            <Field id="pref-time-format" label="Time format">
              <Select
                id="pref-time-format"
                value={draft.timeFormat}
                onChange={set('timeFormat')}
                options={TIME_FORMAT_OPTIONS}
              />
            </Field>

            <Field
              id="pref-start-page"
              label="Start page"
              hint="Where you land after signing in."
              className="sm:col-span-2 sm:max-w-xs"
            >
              <Select
                id="pref-start-page"
                value={draft.startPage}
                onChange={set('startPage')}
                options={START_PAGE_OPTIONS}
                aria-describedby="pref-start-page-hint"
              />
            </Field>
          </div>

          <div className="space-y-4 border-t border-[#1C1A38] pt-5">
            <ToggleRow
              id="pref-compact"
              label="Compact task cards"
              description="Fit more tasks on each Kanban column by trimming card spacing."
              checked={draft.compactCards}
              onChange={set('compactCards')}
            />
            <ToggleRow
              id="pref-motion"
              label="Reduce motion"
              description="Turn off non-essential animations and smooth scrolling."
              checked={draft.reduceMotion}
              onChange={set('reduceMotion')}
            />
          </div>
        </SectionBody>

        <FormActions
          dirty={dirty}
          onCancel={() => setDraft(values)}
          saveLabel="Save preferences"
          leading={
            <button
              type="button"
              onClick={() => setDraft(DEFAULT_PREFERENCES)}
              disabled={isDefault}
              className="inline-flex items-center gap-1.5 rounded text-xs text-[#8B88AE] transition-colors
                         hover:text-[#C9A8FF] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-[#8B88AE]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              <RotateCcw size={12} />
              Restore defaults
            </button>
          }
        />
      </form>
    </SettingsSection>
  );
}