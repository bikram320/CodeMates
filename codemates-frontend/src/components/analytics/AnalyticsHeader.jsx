import { BarChart3 } from "lucide-react";
import BackButton from "../ui/BackButton";

export default function AnalyticsHeader({ projectName }) {
  return (
    <div className="flex flex-col gap-3">
      <BackButton
        label="Back to project"
        className="self-start rounded text-[#8B86B8] hover:text-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60"
      />

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