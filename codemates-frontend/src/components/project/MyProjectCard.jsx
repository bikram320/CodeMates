/**
 * MyProjectCard
 *
 * Project card for the My Projects page.
 * Adapted for the real ProjectResponse shape from Spring Boot:
 *
 *   PRESENT in real API:
 *     id, ownerUserId, name, description, githubRepoUrl,
 *     status (ACTIVE|COMPLETED|ARCHIVED), visibility (PUBLIC|PRIVATE),
 *     techStack (String — comma-separated), maxMembers, memberCount, createdAt
 *
 *   REMOVED vs earlier mock version (fields don't exist in the real API):
 *     - type badge      (no type field)
 *     - role badge      (not in ProjectResponse; comes from member list)
 *     - progress bar    (no taskCount/tasksCompleted in list response)
 *     - lastActivity    (no such field; shows createdAt instead)
 *
 * Props:
 *   project        {ProjectResponse}
 *   onView         {fn}          called when card or button is clicked
 *   currentUserId  {string|null} from auth store — used to show owner crown
 *                                Pass null if auth context is not yet available.
 */

import { Users, Lock, ArrowRight, Crown } from 'lucide-react';
import {FaGithub as Github} from 'react-icons/fa';
// Status display config — mirrors the three valid backend values
const STATUS_CFG = {
  ACTIVE:    { label: 'Active',    dot: 'bg-[#10B981]', text: 'text-[#10B981]', border: 'border-[#10B981]/30', bg: 'bg-[#10B981]/10' },
  COMPLETED: { label: 'Completed', dot: 'bg-[#6C7BFF]', text: 'text-[#6C7BFF]', border: 'border-[#6C7BFF]/30', bg: 'bg-[#6C7BFF]/10' },
  ARCHIVED:  { label: 'Archived',  dot: 'bg-[#6B6890]', text: 'text-[#6B6890]', border: 'border-[#6B6890]/30', bg: 'bg-[#6B6890]/10' },
};

/**
 * techStack in ProjectResponse is a plain String (e.g. "React, TypeScript, Tailwind").
 * Split and trim so we can render individual chips.
 */
function parseTechStack(techStack) {
  if (!techStack) return [];
  return techStack
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function MyProjectCard({ project, onView, currentUserId = null }) {
  const {
    name,
    description,
    status,
    visibility,
    techStack,
    memberCount,
    maxMembers,
    githubRepoUrl,
    createdAt,
    ownerUserId,
  } = project;

  const techList  = parseTechStack(techStack);
  const statusCfg = STATUS_CFG[status] ?? STATUS_CFG.ACTIVE;
  const isOwner   = currentUserId != null && ownerUserId === currentUserId;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onView}
      onKeyDown={(e) => e.key === 'Enter' && onView()}
      className="card-hover p-5 cursor-pointer group"
    >
      {/* ── Top: status + visibility + owner crown ─────────────────────── */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status pill */}
          <span
            className={`inline-flex items-center gap-[9px] text-[15px] font-mono
                        px-3 py-[3px] rounded-full border
                        ${statusCfg.text} ${statusCfg.border} ${statusCfg.bg}`}
          >
            <span className={`w-[9px] h-[9px] rounded-full ${statusCfg.dot}`} />
            {statusCfg.label}
          </span>

          {/* Private badge */}
          {visibility === 'PRIVATE' && (
            <span className="inline-flex items-center gap-1 text-[10px] font-mono
                             text-[#6B6890] border border-[#26224A] px-1.5 py-0.5 rounded">
              <Lock size={9} />
              Private
            </span>
          )}
        </div>

        {/* Crown: only visible when we know the current user owns the project */}
        {isOwner && (
          <Crown
            size={13}
            title="You own this project"
            style={{ color: '#F59E0B' }}
            className="shrink-0"
          />
        )}
      </div>

      {/* ── Project name ────────────────────────────────────────────────── */}
      <h3 className="text-base font-semibold font-mono text-[#F5F5F5]
                     group-hover:text-white transition-colors mb-1.5">
        {name}
      </h3>

      {/* ── Description ─────────────────────────────────────────────────── */}
      <p className="text-sm text-[#8B86B8] leading-relaxed mb-4 line-clamp-2">
        {description || 'No description provided.'}
      </p>

      {/* ── Tech stack chips (parsed from String) ───────────────────────── */}
      {techList.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {techList.map((tech) => (
            <span
              key={tech}
              className="text-[15px] font-mono text-[#C9A8FF] border border-[#2E2A66]
                        px-[9px] py-[3px] rounded"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* ── Footer: meta + view button ──────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-[#26224A]">
        {/* Meta row */}
        <div className="flex items-center gap-4 text-xs text-[#6B6890] flex-wrap">
          {/* memberCount / maxMembers */}
          <span className="flex items-center gap-1.5">
            <Users size={12} />
            {memberCount}
            {maxMembers ? ` / ${maxMembers}` : ''} member{memberCount !== 1 ? 's' : ''}
          </span>

          {/* GitHub indicator */}
          {githubRepoUrl && (
            <span
              className="flex items-center gap-1.5 text-[#A7A3D6]"
              title={githubRepoUrl}
            >
              <Github size={12} />
              GitHub
            </span>
          )}

          {/* Created date (lastActivity not in ProjectResponse) */}
          <span>Created {formatDate(createdAt)}</span>
        </div>

        {/* View project */}
        <button
          onClick={(e) => { e.stopPropagation(); onView(); }}
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