/**
 * RepositorySettings
 *
 * The GitHub repository linked to the project: connection status, the URL
 * field, and Disconnect (behind a confirmation dialog).
 *
 * ⚠️ Demo only — no GitHub connection is made and no OAuth is involved. Saving
 * a valid URL just marks the repository as connected in the mock data.
 *
 * Props:
 *   projectId   {string}   For the link to the project's GitHub page
 *   repository  {object}   { connected, repoUrl, isPrivate, lastSyncedAt, connectedBy }
 *   onSave      {fn}       (repoUrl)  connect or change the repository
 *   onDisconnect {fn}      ()
 */

import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ExternalLink, Link2Off, Lock, Globe } from 'lucide-react';

import {
  DemoBadge,
  Field,
  FormActions,
  SectionBody,
  SettingsSection,
  describedBy,
  inputClass,
} from '../settings/settingsShared';
import { GitHubMark, formatRelativeTime } from '../github/githubShared';
import { ConfirmDialog, PROJECT_SECTION_IDS } from './projectSettingsShared';

const REPO_URL_RE = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?\/?$/i;

/** 'https://github.com/owner/repo(.git)' → 'owner/repo', or null if it isn't a repo URL. */
function parseRepoUrl(value) {
  const match = REPO_URL_RE.exec(value.trim());
  return match ? `${match[1]}/${match[2]}` : null;
}

export default function RepositorySettings({ projectId, repository, onSave, onDisconnect }) {
  const [draftUrl, setDraftUrl] = useState(repository.repoUrl);
  const [submitted, setSubmitted] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const inputRef = useRef(null);

  const { connected } = repository;

  // If a disconnect is rolled back (the save failed), the repository comes back
  // as connected — show its URL again rather than the emptied field. Failed
  // connects / edits keep what the user typed so they can correct it.
  const [wasConnected, setWasConnected] = useState(connected);
  if (connected !== wasConnected) {
    setWasConnected(connected);
    if (connected) {
      setDraftUrl(repository.repoUrl);
      setSubmitted(false);
    }
  }

  const fullName = parseRepoUrl(repository.repoUrl);
  const draftFullName = parseRepoUrl(draftUrl);

  const error = !draftUrl.trim()
    ? 'Enter the repository’s GitHub URL.'
    : !draftFullName
    ? 'Use a link like https://github.com/owner/repository'
    : '';
  const shownError = submitted ? error : '';
  const dirty = draftUrl.trim() !== repository.repoUrl;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (error) {
      setSubmitted(true);
      inputRef.current?.focus();
      return;
    }
    const clean = draftUrl.trim().replace(/\/$/, '').replace(/\.git$/i, '');
    onSave(clean);
    setDraftUrl(clean);
    setSubmitted(false);
  };

  const handleCancel = () => {
    setDraftUrl(repository.repoUrl);
    setSubmitted(false);
  };

  const handleDisconnect = () => {
    setConfirmingDisconnect(false);
    onDisconnect();
    setDraftUrl('');
    setSubmitted(false);
  };

  const VisibilityIcon = repository.isPrivate ? Lock : Globe;

  return (
    <SettingsSection
      id={PROJECT_SECTION_IDS.repository}
      title="Repository"
      description="The GitHub repository this project syncs commits from."
      badge={<DemoBadge title="No GitHub connection is made yet" />}
    >
      {/* ── Connection status ───────────────────────────────────────────── */}
      <div className="border-b border-[#1C1A38] p-5">
        {connected && fullName ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D1A40] text-[#F5F5F5]">
                <GitHubMark size={20} />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-mono text-sm font-semibold text-[#F5F5F5]">{fullName}</p>
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-xs font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Connected
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-[#8B88AE]">
                    <VisibilityIcon size={12} aria-hidden="true" />
                    {repository.isPrivate ? 'Private' : 'Public'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#8B88AE]">
                  Last synced {formatRelativeTime(repository.lastSyncedAt)}
                  {repository.connectedBy && (
                    <>
                      {' · connected by '}
                      <span className="font-mono">@{repository.connectedBy}</span>
                    </>
                  )}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <a
                    href={repository.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded text-[#C9A8FF] hover:underline
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                  >
                    Open on GitHub <ExternalLink size={11} />
                  </a>
                  <Link
                    to={`/projects/${projectId}/github`}
                    className="inline-flex items-center gap-1 rounded text-[#C9A8FF] hover:underline
                               focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                  >
                    View GitHub activity <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setConfirmingDisconnect(true)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2
                         text-sm font-medium text-[#F5F5F5] transition-colors
                         hover:border-red-400/50 hover:text-red-300
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
            >
              <Link2Off size={14} />
              Disconnect repository
            </button>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D1A40] text-[#6B6890]">
              <GitHubMark size={20} />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-[#2E2A66] bg-[#1D1A40] px-2 py-0.5 text-xs font-medium text-[#8B88AE]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6B6890]" />
                Not connected
              </span>
              <p className="mt-2 text-sm text-[#8B88AE]">
                Connect a repository to track commits, pull requests and issues alongside your tasks.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── URL form ────────────────────────────────────────────────────── */}
      <form onSubmit={handleSubmit} noValidate>
        <SectionBody>
          <Field
            id="repo-url"
            label="GitHub repository URL"
            error={shownError}
            hint={
              connected
                ? 'Changing this points the project at a different repository.'
                : 'The full link to the repository on github.com.'
            }
          >
            <input
              ref={inputRef}
              id="repo-url"
              type="url"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="https://github.com/owner/repository"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={Boolean(shownError)}
              aria-describedby={describedBy('repo-url', { error: shownError, hint: true })}
              className={`${inputClass(Boolean(shownError))} font-mono`}
            />
          </Field>
        </SectionBody>

        <FormActions
          dirty={dirty}
          onCancel={handleCancel}
          saveLabel={connected ? 'Update repository' : 'Connect repository'}
        />
      </form>

      <ConfirmDialog
        open={confirmingDisconnect}
        tone="warning"
        title="Disconnect this repository?"
        description={`${fullName ?? 'This repository'} will no longer be linked to this project.`}
        consequences={[
          'Commits stop syncing into this project.',
          'The repository on GitHub is not changed.',
          'You can reconnect it here at any time.',
        ]}
        confirmLabel="Disconnect"
        onConfirm={handleDisconnect}
        onCancel={() => setConfirmingDisconnect(false)}
      />
    </SettingsSection>
  );
}