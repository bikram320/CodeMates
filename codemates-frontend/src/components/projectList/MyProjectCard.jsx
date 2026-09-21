/**
 * MyProjectCard
 *
 * A full-detail project card used on the My Projects page.
 * Intentionally more detailed than the compact card on the Dashboard
 * (which shows only name, description, tech stack, and progress).
 *
 * This card adds: status badge, type badge, role badge, owner crown,
 * GitHub indicator, visibility label, and a "View Project" button.
 *
 * Props:
 *   project  {object}  - from projectMock (ProjectResponse + role/isOwner)
 *   onView   {fn}      - called when "View Project" is clicked
 */

import { Users, Lock, ArrowRight, Crown } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';
import { STATUS_CONFIG, TYPE_CONFIG, ROLE_CONFIG } from '../../mock/projectMock';

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ACTIVE;
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[10px] font-mono
                  px-2 py-0.5 rounded-full border
                  ${cfg.textClass} ${cfg.borderClass} ${cfg.bgClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }) {
  const cfg = TYPE_CONFIG[type] ?? TYPE_CONFIG.OPEN_SOURCE;
  return (
    <span
      className={`text-[10px] font-mono px-2 py-0.5 rounded border
                  ${cfg.textClass} ${cfg.borderClass}`}
    >
      {cfg.label}
    </span>
  );
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.CONTRIBUTOR;
  return (
    <span
      className={`text-[10px] font-mono px-2 py-0.5 rounded border
                  ${cfg.textClass} ${cfg.borderClass} ${cfg.bgClass}`}
    >
      {cfg.label}
    </span>
  );
}

function TechChip({ label }) {
  return (
    <span className="text-[10px] font-mono text-[#C9A8FF] border border-[#2E2A66] px-1.5 py-0.5 rounded">
      {label}
    </span>
  );
}

function ProgressBar({ completed, total }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[10px] font-mono text-[#6B6890] mb-1.5">
        <span>{completed} / {total} tasks</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1 bg-[#26224A] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#6C7BFF] rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main card ─────────────────────────────────────────────────────────────────

export default function MyProjectCard({ project, onView }) {
  const {
    name, description, status, type, role, isOwner,
    memberCount, taskCount, tasksCompleted,
    techStack, lastActivity, visibility, githubRepoUrl,
  } = project;

  return (
    <div className="card-hover p-5 cursor-pointer group" onClick={onView}>

      {/* ── Top row: badges ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {/* Left: status + type */}
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={status} />
          <TypeBadge type={type} />
          {visibility === 'PRIVATE' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#6B6890] border border-[#26224A] px-1.5 py-0.5 rounded">
              <Lock size={9} />
              Private
            </span>
          )}
        </div>

        {/* Right: role */}
        <RoleBadge role={role} />
      </div>

      {/* ── Project name ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-1.5">
        <h3 className="text-base font-semibold font-mono text-[#F5F5F5] group-hover:text-white transition-colors">
          {name}
        </h3>
        {/* Owner crown — subtle indicator that the user created this project */}
        {isOwner && (
          <Crown
            size={13}
            title="You own this project"
            style={{ color: '#F59E0B' }}
            className="shrink-0"
          />
        )}
      </div>

      {/* ── Description ──────────────────────────────────────────────────── */}
      <p className="text-sm text-[#8B86B8] leading-relaxed mb-4 line-clamp-2">
        {description}
      </p>

      {/* ── Tech stack ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {techStack.map((tech) => (
          <TechChip key={tech} label={tech} />
        ))}
      </div>

      {/* ── Progress ─────────────────────────────────────────────────────── */}
      <div className="mb-4">
        <ProgressBar completed={tasksCompleted} total={taskCount} />
      </div>

      {/* ── Footer: meta + action ────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#26224A]">
        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-[#6B6890] flex-wrap">
          <span className="flex items-center gap-1.5">
            <Users size={12} />
            {memberCount} member{memberCount !== 1 ? 's' : ''}
          </span>

          {githubRepoUrl && (
            <span
              className="flex items-center gap-1.5 text-[#A7A3D6]"
              title={githubRepoUrl}
            >
              <FaGithub size={12} />
              GitHub
            </span>
          )}

          <span>{lastActivity}</span>
        </div>

        {/* View Project */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // card click already handles this
            onView();
          }}
          className="flex items-center gap-1.5 text-xs text-[#6C7BFF] font-medium
                     hover:text-[#C9A8FF] transition-colors shrink-0"
        >
          View Project
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}