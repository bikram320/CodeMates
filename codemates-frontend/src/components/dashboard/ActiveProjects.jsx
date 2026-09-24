/**
 * ActiveProjects
 *
 * Grid of the user's active project cards.
 * Each card shows: name, role, description, tech stack, task progress, member count.
 *
 * Props:
 *   projects {Array} - from data.activeProjects (ProjectResponse shape + role/taskCount)
 */

import { FolderKanban, Users, Plus, Lock } from 'lucide-react';

// Role badge colours
const ROLE_STYLES = {
  Leader:      'text-[#6C7BFF] bg-[#6C7BFF]/10 border-[#6C7BFF]/30',
  Contributor: 'text-[#C9A8FF] bg-[#C9A8FF]/10 border-[#C9A8FF]/30',
  Reviewer:    'text-[#A7A3D6] bg-[#A7A3D6]/10 border-[#A7A3D6]/30',
};

function RoleBadge({ role }) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES.Contributor;
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border shrink-0 ${style}`}>
      {role}
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

function ProjectCard({ project }) {
  return (
    <div className="card-hover cursor-pointer p-4">
      {/* Name + role + visibility */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="text-sm font-semibold font-mono text-[#F5F5F5] truncate">
            {project.name}
          </h3>
          {project.visibility === 'PRIVATE' && (
            <Lock size={11} className="text-[#4A4660] shrink-0" />
          )}
        </div>
        <RoleBadge role={project.role} />
      </div>

      {/* Description */}
      <p className="text-xs text-[#8B86B8] leading-relaxed mb-3 line-clamp-2">
        {project.description}
      </p>

      {/* Tech stack */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {project.techStack.map((tech) => (
          <span
            key={tech}
            className="text-[10px] font-mono text-[#C9A8FF] border border-[#2E2A66] px-1.5 py-0.5 rounded"
          >
            {tech}
          </span>
        ))}
      </div>

      {/* Task progress */}
      <ProgressBar completed={project.tasksCompleted} total={project.taskCount} />

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#26224A]">
        <div className="flex items-center gap-1.5 text-[#6B6890]">
          <Users size={12} />
          <span className="text-xs">{project.memberCount} members</span>
        </div>
        <span className="text-[10px] text-[#4A4660]">{project.lastActivity}</span>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-10 text-center">
      <div className="w-12 h-12 rounded-xl bg-[#1D1A40] flex items-center justify-center mx-auto mb-4">
        <FolderKanban size={22} className="text-[#2E2A66]" />
      </div>
      <p className="text-sm text-[#6B6890] mb-1">No active projects yet.</p>
      <p className="text-xs text-[#4A4660] mb-5">
        Create a project or join one to see it here.
      </p>
      <button className="btn-primary text-xs mx-auto">
        <Plus size={13} />
        Create your first project
      </button>
    </div>
  );
}

export default function ActiveProjects({ projects }) {
  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="page-section-heading">Active Projects</h2>
        {projects?.length > 0 && (
          <a
            href="/projects"
            className="text-xs text-[#6C7BFF] hover:text-[#C9A8FF] transition-colors"
          >
            View all →
          </a>
        )}
      </div>

      {!projects?.length ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </section>
  );
}