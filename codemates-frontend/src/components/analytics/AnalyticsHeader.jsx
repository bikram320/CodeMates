import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3 } from "lucide-react";

export default function AnalyticsHeader({ projectId, projectName }) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        to={`/projects/${projectId}`}
        className="inline-flex items-center gap-1.5 self-start rounded text-sm text-[#8B86B8] transition-colors
                   hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
      >
        <ArrowLeft size={14} aria-hidden="true" />
        Back to project
      </Link>

      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6C7BFF]/10 text-[#6C7BFF]"
        >
          <BarChart3 size={20} />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-[#F5F5F5]">Analytics</h1>
          <p className="truncate text-sm text-[#8B86B8]">
            Progress and collaboration{projectName ? ` in ${projectName}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}