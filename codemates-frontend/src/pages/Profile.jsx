import { useEffect, useState } from "react";
import { AlertCircle, Check, RefreshCw, User } from "lucide-react";

import ProfileHeader from "../components/profile/ProfileHeader";
import BasicInfoSection from "../components/profile/BasicInfoSection";
import LinksSection from "../components/profile/LinkSection";
import AvailabilitySection from "../components/profile/AvailabilitySection";
import SkillsSection from "../components/profile/SkillsSection";
import InterestsSection from "../components/profile/InterestsSection.jsx";
import { secondaryButtonClass } from "../components/shared/formControls";
import EmptyState from "../components/ui/EmptyState";

import useProfile from "../hooks/useProfile";

/**
 * Profile page (/profile) — replaces the old Account Settings page.
 *
 * Talks directly to the real user-profile backend via useProfile(). There is
 * no mock layer, no email/password section (that's auth-service, not part of
 * this module), and no notification or app-preference settings — none of
 * that exists in ProfileController. What's here is exactly what the backend
 * supports: identity, links, experience/availability, skills and interests.
 *
 * Basic info, links and availability each save independently (their own PUT
 * with just that section's fields). Skills and interests save immediately on
 * add/remove — they're separate endpoints on the backend, not part of the
 * profile's bulk update.
 */

const getErrorMessage = (err) =>
  err?.message || "Something went wrong. Try again.";

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading your profile" className="flex flex-col gap-6">
      <div
        aria-hidden="true"
        className="flex animate-pulse items-center gap-4 rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5"
      >
        <div className="h-16 w-16 shrink-0 rounded-full bg-[#1D1A40]" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-1/3 rounded bg-[#1D1A40]" />
          <div className="h-3 w-1/4 rounded bg-[#1D1A40]" />
        </div>
      </div>
      {[4, 3, 2].map((rows, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="animate-pulse rounded-xl border border-[#1C1A38] bg-[#0A0918]"
        >
          <div className="border-b border-[#1C1A38] px-5 py-4">
            <div className="h-4 w-32 rounded bg-[#1D1A40]" />
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

function ProfileError({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load your profile"
        description={getErrorMessage(error)}
      />
      <button type="button" onClick={onRetry} className={secondaryButtonClass}>
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

function ProfileNotReady({ onRefresh }) {
  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={User}
        title="Your profile isn't ready yet"
        description="It's still being set up after you signed up. This usually takes a few seconds."
      />
      <button type="button" onClick={onRefresh} className={secondaryButtonClass}>
        <RefreshCw size={14} />
        Refresh
      </button>
    </div>
  );
}

export default function Profile() {
  const {
    profile,
    isLoading,
    isNotReady,
    error,
    refetch,
    updateProfile,
    addSkill,
    removeSkill,
    isAddingSkill,
    addInterest,
    removeInterest,
    isAddingInterest,
  } = useProfile();

  const [notice, setNotice] = useState(null); // { text, tone: 'success' | 'error' }

  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(
      () => setNotice(null),
      notice.tone === "error" ? 6000 : 3500
    );
    return () => clearTimeout(timer);
  }, [notice]);

  const notify = (text, tone = "success") => setNotice({ text, tone });

  /** Save a section, report success, and re-throw so the section's own form
   *  can show the error inline (e.g. "Username already taken"). */
  const save = async (action, successText) => {
    try {
      await action();
      notify(successText);
    } catch (err) {
      throw err;
    }
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      await removeSkill(skillId);
    } catch (err) {
      notify(getErrorMessage(err), "error");
      throw err;
    }
  };

  const handleRemoveInterest = async (interestId) => {
    try {
      await removeInterest(interestId);
    } catch (err) {
      notify(getErrorMessage(err), "error");
      throw err;
    }
  };

  return (
    <div className="profile-page">
      <div className="head-container">
        <h1 className="text-2xl font-bold text-[#F5F5F5]">Profile</h1>
        <p className="mt-1 text-sm text-[#8B88AE]">
          This is what other developers see on your profile and in project teams.
        </p>
      </div>

      <div className="body-container mt-6 flex max-w-4xl flex-col gap-6">
        {isLoading ? (
          <ProfileSkeleton />
        ) : error ? (
          <ProfileError error={error} onRetry={() => refetch()} />
        ) : isNotReady || !profile ? (
          <ProfileNotReady onRefresh={() => refetch()} />
        ) : (
          <>
            <ProfileHeader profile={profile} />

            <BasicInfoSection
              profile={profile}
              onSave={(data) => save(() => updateProfile(data), "Basic info saved.")}
            />

            <LinksSection
              profile={profile}
              onSave={(data) => save(() => updateProfile(data), "Links saved.")}
            />

            <AvailabilitySection
              profile={profile}
              onSave={(data) => save(() => updateProfile(data), "Availability saved.")}
            />

            <SkillsSection
              skills={profile.skills}
              onAdd={addSkill}
              onRemove={handleRemoveSkill}
              isAdding={isAddingSkill}
            />

            <InterestsSection
              interests={profile.interests}
              onAdd={addInterest}
              onRemove={handleRemoveInterest}
              isAdding={isAddingInterest}
            />
          </>
        )}
      </div>

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