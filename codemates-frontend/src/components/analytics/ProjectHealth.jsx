import { Activity, AlertTriangle, CheckCircle2, HelpCircle, Loader2, RefreshCw } from "lucide-react";

import { formatRelativeTime } from "../notifications/NotificationItem";

const STATUS_META = {
  GREEN: { label: "Healthy", desc: "Low predicted risk of abandonment.", icon: CheckCircle2, color: "#5FD3A0" },
  YELLOW: { label: "At risk", desc: "Worth a human look.", icon: AlertTriangle, color: "#E8B54A" },
  RED: { label: "Likely abandoned", desc: "High predicted risk of abandonment.", icon: AlertTriangle, color: "#EF4444" },
};

const outlineButton =
    "inline-flex items-center gap-2 rounded-lg border border-[#2E2A66] px-3 py-1.5 text-xs font-medium " +
    "text-[#F5F5F5] transition-colors duration-150 hover:border-[#6C7BFF] hover:bg-[#1D1A40] " +
    "disabled:cursor-not-allowed disabled:opacity-60 " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6C7BFF]/60";

/**
 * Props:
 * - health       { healthStatus, abandonProbability, computedAt, stale } | null
 * - isLoading / isError / error   state of the GET .../health query
 * - canSync      true for the project LEADER -> shows "Recalculate now"
 * - onSync       () => void   (POST /api/projects/{id}/health/sync)
 * - isSyncing    boolean
 * - syncError    optional Error from the sync mutation (pass syncHealthError
 *                from useProjectAnalytics to show why a recalculation failed)
 */
export default function ProjectHealth({
                                        health,
                                        isLoading,
                                        isError,
                                        error,
                                        canSync,
                                        onSync,
                                        isSyncing,
                                        syncError,
                                      }) {
  const syncButton = canSync && (
      <button type="button" onClick={onSync} disabled={isSyncing} className={outlineButton}>
        {isSyncing ? (
            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
        ) : (
            <RefreshCw size={13} aria-hidden="true" />
        )}
        {isSyncing ? "Recalculating…" : "Recalculate now"}
      </button>
  );

  return (
      <section aria-labelledby="project-health-title" className="rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="project-health-title" className="text-sm font-semibold text-[#F5F5F5]">
              Repository health
            </h2>
            <p className="mt-0.5 text-xs text-[#6B6890]">Predicted abandonment risk from GitHub activity</p>
          </div>
          {syncButton}
        </div>

        {isLoading ? (
            <div className="mt-4 h-14 animate-pulse rounded-lg bg-[#1D1A40]" aria-hidden="true" />
        ) : isError ? (
            <p className="mt-4 text-sm text-[#A9A6C8]">{error?.message || "Couldn't load health status."}</p>
        ) : !health ? (
            <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-dashed border-[#2E2A66] px-4 py-3">
              <Activity size={15} className="mt-0.5 shrink-0 text-[#6B6890]" aria-hidden="true" />
              <p className="text-sm leading-relaxed text-[#8B86B8]">
                No prediction yet. This appears once the project is active, has a linked GitHub repository, and that
                repository has been synced.
                {canSync
                    ? " Press “Recalculate now” to try again."
                    : " Ask the project leader to recalculate it."}
              </p>
            </div>
        ) : (
            <HealthDetails health={health} />
        )}

        {syncError && (
            <p role="alert" className="mt-3 text-xs leading-relaxed text-[#EF4444]">
              Recalculation failed: {syncError.message || "please try again."}
            </p>
        )}

        {canSync && (
            <p className="mt-3 text-xs leading-relaxed text-[#6B6890]">
              Recalculating refreshes this project’s prediction from its linked repository’s latest synced data.
            </p>
        )}
      </section>
  );
}

function HealthDetails({ health }) {
  const meta = STATUS_META[health.healthStatus] ?? {
    label: health.healthStatus,
    desc: "",
    icon: Activity,
    color: "#8B86B8",
  };
  const Icon = meta.icon;
  const pct = health.abandonProbability != null ? Math.round(health.abandonProbability * 100) : null;

  return (
      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-4">
        <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${meta.color}1F`, color: meta.color }}
        >
          <Icon size={20} />
        </span>

          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: meta.color }}>
              {meta.label}
              {pct != null && <span className="font-normal text-[#8B86B8]">· {pct}% predicted risk</span>}
            </p>
            <p className="mt-0.5 text-xs text-[#8B86B8]">{meta.desc}</p>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#6B6890]">
              As of {formatRelativeTime(health.computedAt)}
              <span
                  title="This model's precision on flagging an abandoned project is about 58% — roughly 4 in 10 Yellow/Red flags may be false alarms. Treat this as an estimate, not a certainty."
                  className="inline-flex cursor-help items-center"
              >
              <HelpCircle size={12} aria-hidden="true" />
              <span className="sr-only">
                Estimate only — about 58% precision, so some Yellow/Red flags may be false alarms.
              </span>
            </span>
            </p>
          </div>
        </div>

        {health.stale && (
            <p className="mt-3 text-xs leading-relaxed text-[#E8B54A]">
              The last refresh failed, so this may be out of date. Check that the repository is linked and synced, then
              recalculate.
            </p>
        )}
      </div>
  );
}