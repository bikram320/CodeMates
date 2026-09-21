/**
 * DangerZone (project)
 *
 * Archive / unarchive and delete the project. Both destructive actions go
 * through a confirmation dialog; deleting also requires typing the project
 * name.
 *
 * ⚠️ Mock data only. Archive / unarchive / delete go through the (mock) API
 * via the callbacks below; nothing reaches a real server. Confirming a delete
 * calls `onDeleteRequested()` — the page then shows "Project not found".
 *
 * Props:
 *   projectName        {string}   Must be typed to confirm deletion
 *   status             {'ACTIVE'|'COMPLETED'|'ARCHIVED'}
 *   memberCount        {number}   Used in the deletion warning
 *   onArchive          {fn}
 *   onUnarchive        {fn}
 *   onDeleteRequested  {fn}       Called after the user has typed the project name
 */

import { useState } from 'react';
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react';

import {
  DemoBadge,
  SettingsSection,
  secondaryButtonClass,
} from '../settings/settingsShared';
import { ConfirmDialog, PROJECT_SECTION_IDS } from './projectSettingsShared';

export default function DangerZone({
  projectName,
  status,
  memberCount = 1,
  onArchive,
  onUnarchive,
  onDeleteRequested,
}) {
  const [dialog, setDialog] = useState(null); // null | 'archive' | 'delete'
  const archived = status === 'ARCHIVED';
  const others = Math.max(0, memberCount - 1);

  return (
    <SettingsSection
      id={PROJECT_SECTION_IDS.danger}
      tone="danger"
      title="Danger zone"
      description="Take a moment before you continue. Some of these can’t be undone."
      badge={<DemoBadge title="Mock data — nothing is deleted on a server" />}
    >
      <div>
        {/* ── Archive ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">
              {archived ? 'Unarchive project' : 'Archive project'}
            </h3>
            <p className="mt-1 text-sm text-[#8B88AE]">
              {archived
                ? 'This project is archived and read-only. Unarchive it to start working on it again.'
                : 'Make the project read-only. Members can still view tasks, chat and history, and you can unarchive it any time.'}
            </p>
          </div>

          {archived ? (
            <button type="button" onClick={onUnarchive} className={`${secondaryButtonClass} shrink-0`}>
              <ArchiveRestore size={14} />
              Unarchive project
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setDialog('archive')}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-amber-400/40
                         px-4 py-2 text-sm font-medium text-amber-300 transition-colors
                         hover:bg-amber-400/10 hover:text-amber-200
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
            >
              <Archive size={14} />
              Archive project
            </button>
          )}
        </div>

        {/* ── Delete ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 border-t border-red-400/20 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[#F5F5F5]">Delete project</h3>
            <p className="mt-1 text-sm text-[#8B88AE]">
              Permanently delete this project along with its tasks, chat, resources and contribution history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDialog('delete')}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-red-400/40
                       px-4 py-2 text-sm font-medium text-red-300 transition-colors
                       hover:bg-red-500/10 hover:text-red-200
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
          >
            <Trash2 size={14} />
            Delete project
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'archive'}
        tone="warning"
        title="Archive this project?"
        description={`${projectName} will become read-only for everyone on the team.`}
        consequences={[
          'Tasks, chat and resources can’t be changed while it’s archived.',
          'Members keep read access to everything.',
          'You can unarchive it from this page at any time.',
        ]}
        confirmLabel="Archive project"
        onConfirm={() => {
          setDialog(null);
          onArchive();
        }}
        onCancel={() => setDialog(null)}
      />

      <ConfirmDialog
        open={dialog === 'delete'}
        tone="danger"
        title="Delete this project?"
        description="This permanently deletes the project and everything in it. This can’t be undone."
        consequences={[
          'All tasks, chat history, resources and contribution data are removed.',
          others > 0
            ? `${others} other ${others === 1 ? 'member loses' : 'members lose'} access immediately.`
            : 'You’re the only member, so no one else is affected.',
          'The linked GitHub repository is unlinked but not touched.',
        ]}
        requireText={projectName}
        confirmLabel="Delete project permanently"
        onConfirm={() => {
          setDialog(null);
          onDeleteRequested();
        }}
        onCancel={() => setDialog(null)}
      />
    </SettingsSection>
  );
}