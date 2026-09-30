import { FolderKanban } from 'lucide-react';

export default function MyProjectsHeader() {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-[#1D1A40] flex items-center justify-center shrink-0">
        <FolderKanban size={18} style={{ color: '#6C7BFF' }} />
      </div>
      <h1 className="text-xl font-bold text-[#F5F5F5] tracking-tight">
        My Projects
      </h1>
    </div>
  );
}