/**
 * MyProjectsHeader
 *
 * Page-level header for the My Projects page.
 * Shows the title, summary counts, and the Create Project button.
 *
 * Props:
 *   totalCount  {number}  total projects in the user's list
 *   ownedCount  {number}  projects the user owns
 *   onCreate    {fn}      called when "Create Project" is clicked
 */

import { FolderKanban, Plus } from 'lucide-react';

export default function MyProjectsHeader({ totalCount, ownedCount, onCreate }) {
  const joinedCount = totalCount - ownedCount;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left: title + summary */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#1D1A40] flex items-center justify-center shrink-0">
          <FolderKanban size={18} style={{ color: '#6C7BFF' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
            My Projects
          </h1>
          <p className="text-xs text-[#6B6890] font-mono mt-0.5">
            {ownedCount} owned · {joinedCount} joined
          </p>
        </div>
      </div>

      {/* Right: CTA */}
      <button
        onClick={onCreate}
        className="btn-primary text-sm shrink-0"
      >
        <Plus size={15} />
        Create Project
      </button>
    </div>
  );
}