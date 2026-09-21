import { useEffect, useState } from "react";
import { AlertCircle, Check, RefreshCw, User } from "lucide-react";

import SettingsHeader from "../components/settings/SettingsHeader";
import ProfileSettings from "../components/settings/ProfileSettings";
import AccountSettings from "../components/settings/AccountSettings";
import NotificationSettings from "../components/settings/NotificationSettings";
import PreferencesSettings from "../components/settings/PreferencesSettings";
import DangerZone from "../components/settings/DangerZone";
import {
  SECTION_IDS,
  secondaryButtonClass,
} from "../components/settings/settingsShared";
import EmptyState from "../components/ui/EmptyState";

import useSettings from "../hooks/useSettings";

/**
 * Account Settings page (/settings).
 *
 * ⚠️ MOCK DATA ONLY. Settings come from useSettings() → settingsApi → mock
 * data; there is no backend call yet. Each section keeps its own draft and
 * hands the saved values to the hook. The password change, "sign out
 * everywhere" and account deletion controls remain UI-only: they validate
 * input and show a "demo only" message.
 */

const SECTIONS = [
  { id: SECTION_IDS.profile, label: "Profile" },
  { id: SECTION_IDS.account, label: "Account & security" },
  { id: SECTION_IDS.notifications, label: "Notifications" },
  { id: SECTION_IDS.preferences, label: "Preferences" },
  { id: SECTION_IDS.danger, label: "Danger zone", tone: "danger" },
];

const getErrorMessage = (err) =>
  err?.message || "Something went wrong. Try again.";

/** "3 months ago" style text for the password's last-changed date. */
function formatPasswordAge(iso) {
  if (!iso) return undefined;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return undefined;

  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

  const years = Math.floor(months / 12);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

/* ── Loading + error + empty states ──────────────────────────────────────── */

function SettingsSkeleton() {
  return (
    <div role="status" aria-label="Loading settings" className="flex flex-col gap-6">
      {[6, 3, 4, 3].map((rows, i) => (
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
  );
}

function SettingsError({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load your settings"
        description={getErrorMessage(error)}
      />
      <button type="button" onClick={onRetry} className={secondaryButtonClass}>
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

function SettingsNotReady({ onRefresh }) {
  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={User}
        title="Your settings aren't ready yet"
        description="Your profile is still being set up. This usually takes a few seconds after signing up."
      />
      <button type="button" onClick={onRefresh} className={secondaryButtonClass}>
        <RefreshCw size={14} />
        Refresh
      </button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function Settings() {
  const {
    profile,
    avatarUrl,
    account,
    notifications,
    preferences,
    isLoading,
    isEmpty,
    isError,
    error,
    refetch,
    updateProfile,
    updateAccount,
    updateNotificationPreferences,
    updatePreferences,
  } = useSettings();

  const [notice, setNotice] = useState(null); // { text, tone: 'success' | 'info' | 'error' }

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

  /** Run a save, then report the result. On failure the section keeps the
   *  user's edits (and stays "unsaved") so they can correct them and retry. */
  const save = async (action, successText) => {
    try {
      await action();
      notify(successText);
    } catch (err) {
      notify(getErrorMessage(err), "error");
    }
  };

  const ready = Boolean(profile && account && notifications && preferences);

  return (
    <div className="settings-page">
      <div className="head-container">
        <SettingsHeader
          user={
            ready
              ? { name: profile.fullName, username: profile.username, avatarUrl }
              : undefined
          }
          sections={ready ? SECTIONS : []}
        />
      </div>

      <div className="body-container mt-6 flex max-w-4xl flex-col gap-6">
        {isLoading ? (
          <SettingsSkeleton />
        ) : isError ? (
          <SettingsError error={error} onRetry={() => refetch()} />
        ) : isEmpty || !ready ? (
          <SettingsNotReady onRefresh={() => refetch()} />
        ) : (
          <>
            <ProfileSettings
              values={profile}
              avatarUrl={avatarUrl}
              onSave={(values) =>
                save(() => updateProfile(values), "Profile saved.")
              }
            />

            <AccountSettings
              email={account.email}
              emailVerified={account.emailVerified}
              authProvider={account.authProvider}
              passwordLastChanged={formatPasswordAge(account.passwordChangedAt)}
              onUpdateEmail={(email) =>
                save(
                  () => updateAccount({ email }),
                  `Confirmation link sent to ${email}.`
                )
              }
              onChangePassword={() =>
                notify("Demo only: your password wasn't changed.", "info")
              }
              onSignOutEverywhere={() =>
                notify("Demo only: no sessions were signed out.", "info")
              }
            />

            <NotificationSettings
              values={notifications}
              onSave={(values) =>
                save(
                  () => updateNotificationPreferences(values),
                  "Notification settings saved."
                )
              }
            />

            <PreferencesSettings
              values={preferences}
              onSave={(values) =>
                save(() => updatePreferences(values), "Preferences saved.")
              }
            />

            <DangerZone
              username={profile.username}
              onDeleteRequested={() =>
                notify("Demo only: your account wasn't deleted.", "info")
              }
            />
          </>
        )}
      </div>

      {/* ── Toast ─────────────────────────────────────────────────────────── */}
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
                : notice.tone === "info"
                ? "bg-[#C9A8FF]/20 text-[#C9A8FF]"
                : "bg-[#6C7BFF]/20 text-[#8E9BFF]"
            }`}
          >
            {notice.tone === "success" ? <Check size={12} /> : <AlertCircle size={12} />}
          </span>
          {notice.text}
        </div>
      )}
    </div>
  );
}