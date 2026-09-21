/**
 * ProjectSettingsHeader
 *
 * Back link, title, the project's name / status / visibility, and shortcuts
 * that scroll to each settings section.
 *
 * Props:
 *   projectId    {string}
 *   projectName  {string}
 *   status       {'ACTIVE'|'COMPLETED'|'ARCHIVED'}
 *   visibility   {'PUBLIC'|'PRIVATE'}
 *   sections     {Array}  [{ id, label, tone? }]  ids must match the section ids
 */

import { Link } from 'react-router-dom';
import { ArrowLeft, Globe, Lock } from 'lucide-react';

const STATUS_META = {
  ACTIVE: { label: 'Active', dot: 'bg-emerald-400' },
  COMPLETED: { label: 'Completed', dot: 'bg-[#6C7BFF]' },
  ARCHIVED: { label: 'Archived', dot: 'bg-amber-400' },
};

export default function ProjectSettingsHeader({
  projectId,
  projectName,
  status = 'ACTIVE',
  visibility = 'PRIVATE',
  sections = [],
}) {
  const statusMeta = STATUS_META[status] ?? STATUS_META.ACTIVE;
  const VisibilityIcon = visibility === 'PUBLIC' ? Globe : Lock;

  const goTo = (event, id) => {
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
  };

  return (
    <header>
      <Link
        to={`/projects/${projectId}`}
        className="mb-3 inline-flex items-center gap-1.5 rounded text-xs text-[#8B88AE]
                   transition-colors hover:text-[#C9A8FF]
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
      >
        <ArrowLeft size={13} />
        {projectName || 'Project'}
      </Link>

      <h1 className="text-2xl font-bold text-[#F5F5F5]">Project settings</h1>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <p className="min-w-0 truncate text-sm text-[#8B88AE]">{projectName}</p>

        <span className="inline-flex items-center gap-1.5 text-xs text-[#8B88AE]">
          <span className={`h-1.5 w-1.5 rounded-full ${statusMeta.dot}`} />
          {statusMeta.label}
        </span>

        <span className="inline-flex items-center gap-1.5 text-xs text-[#8B88AE]">
          <VisibilityIcon size={12} aria-hidden="true" />
          {visibility === 'PUBLIC' ? 'Public' : 'Private'}
        </span>
      </div>

      <nav aria-label="Project settings sections" className="mt-5">
        <ul className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {sections.map(({ id, label, tone }) => (
            <li key={id} className="shrink-0">
              <a
                href={`#${id}`}
                onClick={(e) => goTo(e, id)}
                className={`inline-flex rounded-lg border border-[#1C1A38] bg-[#0A0918] px-3 py-2 text-sm font-medium
                            text-[#8B88AE] transition-colors duration-150
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60 ${
                              tone === 'danger'
                                ? 'hover:border-red-400/40 hover:text-red-300'
                                : 'hover:border-[#2E2A66] hover:text-[#F5F5F5]'
                            }`}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}