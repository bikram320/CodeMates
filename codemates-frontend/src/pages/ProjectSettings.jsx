import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  AlertCircle,
  Archive,
  Check,
  FolderX,
  Info,
  Lock,
  RefreshCw,
} from "lucide-react";

import ProjectSettingsHeader from "../components/projectSettings/ProjectSettingsHeader";
import GeneralSettings from "../components/projectSettings/GeneralSettings";
import RepositorySettings from "../components/projectSettings/RepositorySettings";
import TeamSettings from "../components/projectSettings/TeamSettings";
import DangerZone from "../components/projectSettings/DangerZone";
import { PROJECT_SECTION_IDS } from "../components/projectSettings/projectSettingsShared";
import { secondaryButtonClass } from "../components/settings/settingsShared";
import EmptyState from "../components/ui/EmptyState";

import useProjectSettings from "../hooks/useProjectSettings";

/**
 * Project Settings page (/projects/:projectId/settings).
 *
 * ⚠️ MOCK DATA ONLY. Settings come from useProjectSettings(projectId) →
 * projectSettingsApi → mock data; there is no backend call yet. No GitHub
 * connection is made, and archiving or deleting only affects the mock data.
 *
 * Only project leaders can change settings. Archiving, deleting and
 * disconnecting the repository each ask for confirmation in a dialog first
 * (deleting also requires typing the project name).
 */

const SECTIONS = [
  { id: PROJECT_SECTION_IDS.general, label: "General" },
  { id: PROJECT_SECTION_IDS.repository, label: "Repository" },
  { id: PROJECT_SECTION_IDS.team, label: "Team" },
  { id: PROJECT_SECTION_IDS.danger, label: "Danger zone", tone: "danger" },
];

const getErrorMessage = (err) =>
  err?.message || "Something went wrong. Try again.";

/* ── Loading + error states ──────────────────────────────────────────────── */

function ProjectSettingsSkeleton() {
  return (
    <div role="status" aria-label="Loading project settings" className="flex flex-col gap-6">
      <div aria-hidden="true" className="animate-pulse">
        <div className="h-3 w-24 rounded bg-[#1D1A40]" />
        <div className="mt-4 h-7 w-56 rounded bg-[#1D1A40]" />
        <div className="mt-3 h-3 w-40 rounded bg-[#1D1A40]" />
      </div>
      <div className="flex max-w-4xl flex-col gap-6">
        {[6, 3, 4, 2].map((rows, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="animate-pulse rounded-xl border border-[#1C1A38] bg-[#0A0918]"
          >
            <div className="border-b border-[#1C1A38] px-5 py-4">
              <div className="h-4 w-32 rounded bg-[#1D1A40]" />
              <div className="mt-2 h-3 w-2/3 rounded bg-[#1D1A40]" />
            </div>
            <div className="space-y-4 p-5">
              {Array.from({ length: rows }).map((_, j) => (
                <div key={j} className="h-10 rounded-lg bg-[#1D1A40]/60" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectSettingsError({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load project settings"
        description={getErrorMessage(error)}
      />
      <button type="button" onClick={onRetry} className={secondaryButtonClass}>
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ProjectSettings() {
  const { projectId } = useParams();

  const {
    general,
    repository,
    team,
    status,
    memberCount,
    pendingInviteCount,
    canManage,
    isLoading,
    isEmpty,
    isError,
    error,
    refetch,
    updateProjectSettings,
    updateRepositorySettings,
    updateTeamSettings,
    archiveProject,
    unarchiveProject,
    deleteProject,
  } = useProjectSettings(projectId);

  const [notice, setNotice] = useState(null); // { text, tone: 'success' | 'error' }

  /* Auto-dismiss the toast (errors stay a little longer) */
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(
      () => setNotice(null),
      notice.tone === "error" ? 6000 : 4000
    );
    return () => clearTimeout(timer);
  }, [notice]);

  const notify = (text, tone = "success") => setNotice({ text, tone });

  /** Run a change, then report the result. On failure the section keeps the
   *  user's edits (and stays "unsaved") so they can correct them and retry. */
  const save = async (action, successText) => {
    try {
      await action();
      notify(successText);
    } catch (err) {
      notify(getErrorMessage(err), "error");
    }
  };

  /* ── What to show ──────────────────────────────────────────────────────── */

  let body;

  if (isLoading) {
    body = <ProjectSettingsSkeleton />;
  } else if (isError) {
    body = <ProjectSettingsError error={error} onRetry={() => refetch()} />;
  } else if (isEmpty || !general || !repository || !team) {
    body = (
      <EmptyState
        icon={FolderX}
        title="Project not found"
        description="This project doesn't exist or may have been removed."
      />
    );
  } else if (!canManage) {
    // Only leaders can change project settings.
    body = (
      <EmptyState
        icon={Lock}
        title="Only project leaders can change settings"
        description="Ask a leader of this project if something needs to be updated."
      />
    );
  } else {
    body = (
      <>
        <div className="head-container">
          <ProjectSettingsHeader
            projectId={projectId}
            projectName={general.name}
            status={status}
            visibility={general.visibility}
            sections={SECTIONS}
          />
        </div>

        <div className="body-container mt-6 flex max-w-4xl flex-col gap-6">
          {/* Always-visible reminder that nothing is saved to a server */}
          <div
            role="note"
            className="flex items-start gap-2.5 rounded-xl border border-[#C9A8FF]/25 bg-[#C9A8FF]/5 px-4 py-3"
          >
            <Info size={15} className="mt-0.5 shrink-0 text-[#C9A8FF]" />
            <p className="text-xs leading-relaxed text-[#A9A6C8]">
              <span className="font-medium text-[#F5F5F5]">Demo mode.</span>{" "}
              Changes here stay in this browser tab. Nothing is saved to a server yet.
            </p>
          </div>

          {status === "ARCHIVED" && (
            <div
              role="note"
              className="flex items-start gap-2.5 rounded-xl border border-amber-400/30 bg-amber-400/5 px-4 py-3"
            >
              <Archive size={15} className="mt-0.5 shrink-0 text-amber-300" />
              <p className="text-xs leading-relaxed text-amber-100/80">
                <span className="font-medium text-amber-200">This project is archived.</span>{" "}
                Other project pages are read-only for members. Unarchive it from the danger zone to
                start working again.
              </p>
            </div>
          )}

          <GeneralSettings
            values={general}
            onSave={(values) =>
              save(() => updateProjectSettings(values), "General settings saved.")
            }
          />

          <RepositorySettings
            projectId={projectId}
            repository={repository}
            onSave={(repoUrl) =>
              save(
                () => updateRepositorySettings({ repoUrl }),
                repository.connected ? "Repository updated." : "Repository connected."
              )
            }
            onDisconnect={() =>
              save(
                () => updateRepositorySettings({ repoUrl: "" }),
                "Repository disconnected."
              )
            }
          />

          <TeamSettings
            values={team}
            memberCount={memberCount}
            pendingCount={pendingInviteCount}
            onSave={(values) =>
              save(() => updateTeamSettings(values), "Team settings saved.")
            }
          />

          <DangerZone
            projectName={general.name}
            status={status}
            memberCount={memberCount}
            onArchive={() => save(() => archiveProject(), "Project archived.")}
            onUnarchive={() => save(() => unarchiveProject(), "Project unarchived.")}
            onDeleteRequested={() => save(() => deleteProject(), "Project deleted.")}
          />
        </div>
      </>
    );
  }

  return (
    <div className="project-settings-page">
      {body}

      {/* ── Toast (stays visible even after the project is deleted) ─────────── */}
      {notice && (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          aria-live={notice.tone === "error" ? "assertive" : "polite"}
          className="fixed bottom-4 left-4 right-4 z-40 mx-auto flex max-w-sm items-center gap-2.5 rounded-xl
                     border border-[#2E2A66] bg-[#0F0E24] px-4 py-3 text-sm text-[#F5F5F5]
                     shadow-xl shadow-black/50 sm:left-auto sm:right-6 sm:mx-0"
        >
          <span
            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              notice.tone === "error"
                ? "bg-red-400/20 text-red-300"
                : "bg-[#6C7BFF]/20 text-[#8E9BFF]"
            }`}
          >
            {notice.tone === "error" ? <AlertCircle size={12} /> : <Check size={12} />}
          </span>
          {notice.text}
        </div>
      )}
    </div>
  );
}