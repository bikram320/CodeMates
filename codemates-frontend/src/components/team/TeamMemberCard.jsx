/**
 * TeamMemberCard
 *
 * A single member on the Project Team page: avatar (initials placeholder),
 * role, joined date, and (for leaders) a menu to change the role or remove
 * the member.
 *
 * ProjectMemberResponseDto only carries { id, projectId, userId, role,
 * joinedAt, invitedByUserId } — no name, username, skills, availability,
 * avatar, or task count. Those all rendered from mock fields before; since
 * there's no profile-by-userId lookup on the backend yet, this card now
 * shows a shortened userId in place of a name and drops skills/availability/
 * tasks-done entirely rather than fake them.
 *
 * Also exports the shared role config so TeamFilters and InviteMemberModal
 * render roles the same way.
 *
 * Props:
 *   member          {object}  { id, projectId, userId, role, joinedAt, invitedByUserId }
 *   profile         {object?} resolved user profile (name, username) from useUserDirectory
 *   isCurrentUser   {boolean} Shows a "you" tag
 *   canManage       {boolean} Show the ⋯ menu (viewer is a project leader)
 *   isLastLeader    {boolean} Member is the only leader — role/removal locked
 *   onChangeRole    {fn}      (memberUserId, newRole)
 *   onRemove        {fn}      (member)
 */

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Code,
  Crown,
  MoreHorizontal,
  ShieldCheck,
  UserMinus,
} from 'lucide-react';
import Avatar from '../ui/Avatar';
import { getDisplayName, getUsername, shortId } from './memberDisplay';

/* ── Shared config ───────────────────────────────────────────────────────── */

export const ROLES = ['LEADER', 'CONTRIBUTOR', 'REVIEWER'];

export const ROLE_META = {
  LEADER: {
    label: 'Leader',
    icon: Crown,
    description: 'Manages members, roles and project settings.',
    badge: 'bg-[#C9A8FF]/10 text-[#C9A8FF] border-[#C9A8FF]/30',
    iconBox: 'bg-[#C9A8FF]/10 text-[#C9A8FF]',
  },
  CONTRIBUTOR: {
    label: 'Contributor',
    icon: Code,
    description: 'Takes on tasks and ships work to the project.',
    badge: 'bg-[#6C7BFF]/10 text-[#8E9BFF] border-[#6C7BFF]/30',
    iconBox: 'bg-[#6C7BFF]/10 text-[#8E9BFF]',
  },
  REVIEWER: {
    label: 'Reviewer',
    icon: ShieldCheck,
    description: 'Reviews submitted work and approves tasks.',
    badge: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25',
    iconBox: 'bg-emerald-400/10 text-emerald-300',
  },
};

function formatJoined(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/* ── Manage menu ─────────────────────────────────────────────────────────── */

function MemberMenu({ member, label, isLastLeader, onChangeRole, onRemove }) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handleMouseDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setConfirming(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setConfirming(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    setConfirming(false);
  };

  const pickRole = (role) => {
    if (role !== member.role) onChangeRole(member.userId, role);
    closeMenu();
  };

  return (
      <div ref={containerRef} className="relative shrink-0">
        <button
            ref={triggerRef}
            type="button"
            onClick={() => (open ? closeMenu() : setOpen(true))}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`Manage ${label}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6890]
                   transition-colors duration-150 hover:bg-[#1D1A40] hover:text-[#F5F5F5]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
        >
          <MoreHorizontal size={16} />
        </button>

        {open && (
            <div
                role="menu"
                aria-label={`Actions for ${label}`}
                className="absolute right-0 top-full z-20 mt-1.5 w-60 rounded-xl border border-[#2E2A66]
                     bg-[#0F0E24] p-1.5 shadow-xl shadow-black/50"
            >
              {confirming ? (
                  /* ── Inline remove confirmation ─────────────────────────────── */
                  <div className="p-2.5">
                    <p className="text-sm font-medium text-[#F5F5F5]">
                      Remove {label}?
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[#8B88AE]">
                      They lose access to this project. Their completed work stays.
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                          type="button"
                          onClick={() => setConfirming(false)}
                          className="flex-1 rounded-lg border border-[#2E2A66] px-3 py-1.5 text-xs font-medium
                             text-[#F5F5F5] transition-colors hover:bg-[#1D1A40]
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
                      >
                        Keep
                      </button>
                      <button
                          type="button"
                          onClick={() => {
                            onRemove(member);
                            closeMenu();
                          }}
                          className="flex-1 rounded-lg bg-red-500/90 px-3 py-1.5 text-xs font-semibold
                             text-white transition-colors hover:bg-red-500
                             focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300/70"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
              ) : (
                  <>
                    <p className="px-2.5 pb-1 pt-1.5 text-xs font-medium text-[#6B6890]">
                      Change role
                    </p>

                    {ROLES.map((role) => {
                      const meta = ROLE_META[role];
                      const Icon = meta.icon;
                      const selected = member.role === role;
                      const locked = isLastLeader && !selected;

                      return (
                          <button
                              key={role}
                              type="button"
                              role="menuitemradio"
                              aria-checked={selected}
                              disabled={locked}
                              onClick={() => pickRole(role)}
                              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm
                               text-[#F5F5F5] transition-colors hover:bg-[#1D1A40]
                               focus:outline-none focus-visible:bg-[#1D1A40]
                               disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                          >
                            <Icon size={14} className="shrink-0 text-[#8B88AE]" />
                            <span className="flex-1">{meta.label}</span>
                            {selected && <Check size={14} className="text-[#6C7BFF]" />}
                          </button>
                      );
                    })}

                    {isLastLeader && (
                        <p className="px-2.5 pb-1 pt-1 text-xs leading-relaxed text-[#8B88AE]">
                          Promote another member to leader before changing this role.
                        </p>
                    )}

                    <div className="my-1.5 border-t border-[#1C1A38]" />

                    <button
                        type="button"
                        role="menuitem"
                        disabled={isLastLeader}
                        onClick={() => setConfirming(true)}
                        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm
                           text-red-300 transition-colors hover:bg-red-500/10
                           focus:outline-none focus-visible:bg-red-500/10
                           disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                      <UserMinus size={14} className="shrink-0" />
                      Remove from project
                    </button>
                  </>
              )}
            </div>
        )}
      </div>
  );
}

/* ── Card ────────────────────────────────────────────────────────────────── */

export default function TeamMemberCard({
                                         member,
                                         profile = null,
                                         isCurrentUser = false,
                                         canManage = false,
                                         isLastLeader = false,
                                         onChangeRole,
                                         onRemove,
                                       }) {
  const role = ROLE_META[member.role] ?? ROLE_META.CONTRIBUTOR;
  const RoleIcon = role.icon;
  const joined = formatJoined(member.joinedAt);
  const name = getDisplayName(profile, member.userId);
  const username = getUsername(profile);

  return (
      <article className="relative flex flex-col gap-4 rounded-xl border border-[#1C1A38] bg-[#0A0918] p-4
                        transition-colors duration-150 hover:border-[#2E2A66]">
        <div className="flex items-start gap-3">
          <Avatar name={profile ? name : ''} size={44} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-sm font-semibold text-[#F5F5F5]">{name}</h3>
              {isCurrentUser && (
                  <span className="shrink-0 rounded bg-[#1D1A40] px-1.5 py-0.5 font-mono text-[10px] text-[#8B88AE]">
                you
              </span>
              )}
            </div>
            {username && <p className="truncate text-xs text-[#8B88AE]">{username}</p>}
          </div>

          {canManage && (
              <MemberMenu
                  member={member}
                  label={name}
                  isLastLeader={isLastLeader}
                  onChangeRole={onChangeRole}
                  onRemove={onRemove}
              />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
        <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5
                      font-mono text-[10px] font-semibold uppercase tracking-wider ${role.badge}`}
        >
          <RoleIcon size={11} />
          {member.role}
        </span>
        </div>

        <div className="mt-auto flex items-center border-t border-[#1C1A38] pt-3 text-xs text-[#6B6890]">
          <span>{joined ? `Joined ${joined}` : ''}</span>
        </div>
      </article>
  );
}