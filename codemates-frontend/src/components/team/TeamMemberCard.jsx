/**
 * TeamMemberCard
 *
 * A single member on the Project Team page: avatar, name, username, project
 * role, availability, skills, and (for leaders) a menu to change the role or
 * remove the member.
 *
 * Also exports the shared role / availability config so TeamFilters and
 * InviteMemberModal render roles the same way.
 *
 * Props:
 *   member          {object}  { id, name, username, avatarUrl?, role, availability,
 *                               skills[], joinedAt, tasksCompleted }
 *   isCurrentUser   {boolean} Shows a "you" tag
 *   canManage       {boolean} Show the ⋯ menu (viewer is a project leader)
 *   isLastLeader    {boolean} Member is the only leader — role/removal locked
 *   onChangeRole    {fn}      (memberId, newRole)
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

export const AVAILABILITY_META = {
  AVAILABLE: { label: 'Available', dot: 'bg-emerald-400' },
  BUSY: { label: 'Busy', dot: 'bg-amber-400' },
  AWAY: { label: 'Away', dot: 'bg-[#6B6890]' },
};

/* ── Avatar ──────────────────────────────────────────────────────────────── */

const AVATAR_GRADIENTS = [
  'from-[#6C7BFF] to-[#C9A8FF]',
  'from-[#C9A8FF] to-[#6C7BFF]',
  'from-[#5A67E0] to-[#B79CFF]',
  'from-[#8E9BFF] to-[#C9A8FF]',
];

function hashString(str) {
  let h = 0;
  for (const ch of str) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function Avatar({ member }) {
  const [imgFailed, setImgFailed] = useState(false);
  const availability = AVAILABILITY_META[member.availability];
  const gradient =
    AVATAR_GRADIENTS[hashString(member.username) % AVATAR_GRADIENTS.length];

  return (
    <div className="relative shrink-0">
      {member.avatarUrl && !imgFailed ? (
        <img
          src={member.avatarUrl}
          alt=""
          onError={() => setImgFailed(true)}
          className="h-11 w-11 rounded-full object-cover"
        />
      ) : (
        <div
          aria-hidden="true"
          className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-sm font-bold text-[#0A0918]`}
        >
          {getInitials(member.name)}
        </div>
      )}

      {/* Presence dot */}
      {availability && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0A0918] ${availability.dot}`}
          title={availability.label}
        />
      )}
    </div>
  );
}

/* ── Manage menu ─────────────────────────────────────────────────────────── */

function MemberMenu({ member, isLastLeader, onChangeRole, onRemove }) {
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
    if (role !== member.role) onChangeRole(member.id, role);
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
        aria-label={`Manage ${member.name}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B6890]
                   transition-colors duration-150 hover:bg-[#1D1A40] hover:text-[#F5F5F5]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div
          role="menu"
          aria-label={`Actions for ${member.name}`}
          className="absolute right-0 top-full z-20 mt-1.5 w-60 rounded-xl border border-[#2E2A66]
                     bg-[#0F0E24] p-1.5 shadow-xl shadow-black/50"
        >
          {confirming ? (
            /* ── Inline remove confirmation ─────────────────────────────── */
            <div className="p-2.5">
              <p className="text-sm font-medium text-[#F5F5F5]">
                Remove {member.name}?
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

const MAX_VISIBLE_SKILLS = 4;

function formatJoined(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function TeamMemberCard({
  member,
  isCurrentUser = false,
  canManage = false,
  isLastLeader = false,
  onChangeRole,
  onRemove,
}) {
  const role = ROLE_META[member.role] ?? ROLE_META.CONTRIBUTOR;
  const RoleIcon = role.icon;
  const availability = AVAILABILITY_META[member.availability];

  const visibleSkills = member.skills.slice(0, MAX_VISIBLE_SKILLS);
  const hiddenSkills = member.skills.slice(MAX_VISIBLE_SKILLS);
  const joined = formatJoined(member.joinedAt);

  return (
    <article className="relative flex flex-col gap-4 rounded-xl border border-[#1C1A38] bg-[#0A0918] p-4
                        transition-colors duration-150 hover:border-[#2E2A66]">
      {/* ── Identity ──────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Avatar member={member} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[#F5F5F5]">
              {member.name}
            </h3>
            {isCurrentUser && (
              <span className="shrink-0 rounded bg-[#1D1A40] px-1.5 py-0.5 font-mono text-[10px] text-[#8B88AE]">
                you
              </span>
            )}
          </div>
          <p className="truncate font-mono text-xs text-[#8B88AE]">
            @{member.username}
          </p>
        </div>

        {canManage && (
          <MemberMenu
            member={member}
            isLastLeader={isLastLeader}
            onChangeRole={onChangeRole}
            onRemove={onRemove}
          />
        )}
      </div>

      {/* ── Role + availability ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5
                      font-mono text-[10px] font-semibold uppercase tracking-wider ${role.badge}`}
        >
          <RoleIcon size={11} />
          {member.role}
        </span>

        {availability && (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#8B88AE]">
            <span className={`h-1.5 w-1.5 rounded-full ${availability.dot}`} />
            {availability.label}
          </span>
        )}
      </div>

      {/* ── Skills ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5">
        {visibleSkills.length === 0 ? (
          <span className="text-xs text-[#6B6890]">No skills listed</span>
        ) : (
          visibleSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-md bg-[#1D1A40] px-2 py-0.5 font-mono text-[11px] text-[#C9A8FF]"
            >
              {skill}
            </span>
          ))
        )}
        {hiddenSkills.length > 0 && (
          <span
            title={hiddenSkills.join(', ')}
            className="rounded-md bg-[#1D1A40] px-2 py-0.5 font-mono text-[11px] text-[#8B88AE]"
          >
            +{hiddenSkills.length}
          </span>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#1C1A38] pt-3 text-xs text-[#6B6890]">
        <span>{joined ? `Joined ${joined}` : ''}</span>
        <span>
          <span className="font-mono text-[#8B88AE]">{member.tasksCompleted ?? 0}</span>{' '}
          tasks done
        </span>
      </div>
    </article>
  );
}