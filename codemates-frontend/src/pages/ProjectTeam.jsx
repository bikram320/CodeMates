import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Check,
  RefreshCw,
  UserPlus,
} from "lucide-react";

import TeamFilters from "../components/team/TeamFilters";
import TeamMemberList from "../components/team/TeamMemberList";
import InviteMemberModal from "../components/team/InviteMemberModal";
import { ROLES } from "../components/team/TeamMemberCard";
import EmptyState from "../components/ui/EmptyState";

import useProjectTeam from "../hooks/useProjectTeam";
import {
  projectDetails,
  defaultProjectDetails,
} from "../mock/projectDetailsMock";

/**
 * Project Team page (/projects/:projectId/team).
 *
 * Data comes from useProjectTeam(projectId) → teamApi → mock data for now.
 * Search + role filtering stay client-side; invite / change role / remove go
 * through the hook's mutations and report success or failure in the toast.
 */

// Quick-pick chips in the invite modal (static for now).
const SUGGESTED_DEVELOPERS = [
  { username: "nina_codes", name: "Nina Rossi" },
  { username: "kaito_ml", name: "Kaito Mori" },
  { username: "ethan_rs", name: "Ethan Ross" },
];

const secondaryButton =
  "inline-flex items-center gap-2 rounded-lg border border-[#2E2A66] px-4 py-2 text-sm font-medium " +
  "text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

const getErrorMessage = (err) =>
  err?.message || "Something went wrong. Try again.";

/* ── Loading + error states ──────────────────────────────────────────────── */

function TeamSkeleton() {
  return (
    <>
      <div
        aria-hidden="true"
        className="h-[42px] w-full animate-pulse rounded-lg border border-[#1C1A38] bg-[#0A0918] lg:max-w-sm"
      />
      <div
        role="status"
        aria-label="Loading team"
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            aria-hidden="true"
            className="animate-pulse rounded-xl border border-[#1C1A38] bg-[#0A0918] p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-full bg-[#1D1A40]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-2/5 rounded bg-[#1D1A40]" />
                <div className="h-3 w-1/4 rounded bg-[#1D1A40]" />
              </div>
            </div>
            <div className="mt-4 h-5 w-28 rounded bg-[#1D1A40]" />
            <div className="mt-4 flex gap-1.5">
              <div className="h-5 w-14 rounded bg-[#1D1A40]" />
              <div className="h-5 w-16 rounded bg-[#1D1A40]" />
              <div className="h-5 w-12 rounded bg-[#1D1A40]" />
            </div>
            <div className="mt-4 border-t border-[#1C1A38] pt-3">
              <div className="h-3 w-1/2 rounded bg-[#1D1A40]" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function TeamError({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center">
      <EmptyState
        icon={AlertCircle}
        title="Couldn't load the team"
        description={getErrorMessage(error)}
      />
      <button type="button" onClick={onRetry} className={secondaryButton}>
        <RefreshCw size={14} />
        Try again
      </button>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ProjectTeam() {
  const { projectId } = useParams();
  const project = projectDetails[projectId] ?? defaultProjectDetails;

  const {
    members,
    pendingInvites,
    currentUserId,
    isLoading,
    isError,
    error,
    refetch,
    inviteMember,
    removeMember,
    changeMemberRole,
  } = useProjectTeam(projectId);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [notice, setNotice] = useState(null); // { text, tone: 'success' | 'error' }

  /* Auto-dismiss the toast (errors stay a little longer) */
  useEffect(() => {
    if (!notice) return undefined;
    const timer = setTimeout(
      () => setNotice(null),
      notice.tone === "error" ? 5000 : 3500
    );
    return () => clearTimeout(timer);
  }, [notice]);

  const viewer = members.find((m) => m.id === currentUserId);
  const canManage = viewer?.role === "LEADER";

  const counts = useMemo(() => {
    const result = { ALL: members.length };
    ROLES.forEach((role) => {
      result[role] = members.filter((m) => m.role === role).length;
    });
    return result;
  }, [members]);

  const filteredMembers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return members
      .filter((m) => roleFilter === "ALL" || m.role === roleFilter)
      .filter(
        (m) =>
          !query ||
          m.name.toLowerCase().includes(query) ||
          m.username.toLowerCase().includes(query) ||
          m.skills.some((skill) => skill.toLowerCase().includes(query))
      )
      .sort(
        (a, b) =>
          ROLES.indexOf(a.role) - ROLES.indexOf(b.role) ||
          a.name.localeCompare(b.name)
      );
  }, [members, search, roleFilter]);

  const availableCount = members.filter(
    (m) => m.availability === "AVAILABLE"
  ).length;

  /* ── Actions ───────────────────────────────────────────────────────────── */

  const notify = (text, tone = "success") => setNotice({ text, tone });

  const handleChangeRole = async (memberId, role) => {
    const target = members.find((m) => m.id === memberId);
    if (!target) return;
    try {
      await changeMemberRole(memberId, role);
      notify(`${target.name} is now a ${role.toLowerCase()}.`);
    } catch (err) {
      notify(getErrorMessage(err), "error");
    }
  };

  const handleRemove = async (member) => {
    try {
      await removeMember(member.id);
      notify(`${member.name} was removed from the project.`);
    } catch (err) {
      notify(getErrorMessage(err), "error");
    }
  };

  const handleInvite = async ({ identifier, role }) => {
    const label = identifier.includes("@") ? identifier : `@${identifier}`;
    try {
      await inviteMember(identifier, role);
      notify(`Invitation sent to ${label} as ${role.toLowerCase()}.`);
    } catch (err) {
      notify(getErrorMessage(err), "error");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
  };

  return (
    <div className="project-team-page">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="head-container flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Link
            to={`/projects/${projectId}`}
            className="mb-3 inline-flex items-center gap-1.5 rounded text-xs text-[#8B88AE]
                       transition-colors hover:text-[#C9A8FF]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
          >
            <ArrowLeft size={13} />
            {project?.name ?? "Project"}
          </Link>

          <h1 className="text-2xl font-bold text-[#F5F5F5]">Team</h1>
          <p className="mt-1 text-sm text-[#8B88AE]">
            {isLoading ? (
              "Loading team…"
            ) : isError ? (
              "Team unavailable"
            ) : (
              <>
                {members.length} {members.length === 1 ? "member" : "members"}
                {" · "}
                {availableCount} available
                {pendingInvites.length > 0 &&
                  ` · ${pendingInvites.length} pending`}
              </>
            )}
          </p>
        </div>

        {canManage && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#6C7BFF] px-4 py-2.5
                       text-sm font-semibold text-[#0A0918] transition-colors hover:bg-[#8190FF]
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A8FF] sm:w-auto"
          >
            <UserPlus size={15} />
            Invite member
          </button>
        )}
      </div>

      {/* ── Filters + list ──────────────────────────────────────────────── */}
      <div className="body-container mt-6 flex flex-col gap-5">
        {isLoading ? (
          <TeamSkeleton />
        ) : isError ? (
          <TeamError error={error} onRetry={() => refetch()} />
        ) : (
          <>
            <TeamFilters
              search={search}
              onSearchChange={setSearch}
              role={roleFilter}
              onRoleChange={setRoleFilter}
              counts={counts}
            />

            <TeamMemberList
              members={filteredMembers}
              totalCount={members.length}
              hasActiveFilters={search.trim() !== "" || roleFilter !== "ALL"}
              currentUserId={currentUserId}
              canManage={canManage}
              leaderCount={counts.LEADER}
              onChangeRole={handleChangeRole}
              onRemove={handleRemove}
              onInvite={() => setInviteOpen(true)}
              onClearFilters={clearFilters}
            />
          </>
        )}
      </div>

      {/* ── Invite modal ────────────────────────────────────────────────── */}
      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        takenIdentifiers={[
          ...members.map((m) => m.username),
          ...pendingInvites.map((m) => m.username),
        ]}
        suggestions={SUGGESTED_DEVELOPERS}
      />

      {/* ── Confirmation / error toast ──────────────────────────────────── */}
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
            {notice.tone === "error" ? (
              <AlertCircle size={12} />
            ) : (
              <Check size={12} />
            )}
          </span>
          {notice.text}
        </div>
      )}
    </div>
  );
}