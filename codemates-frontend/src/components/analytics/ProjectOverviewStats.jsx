import { AlertTriangle, CheckCircle2, Clock, Flag, ListChecks } from "lucide-react";

const card = "rounded-xl border border-[#1C1A38] bg-[#0A0918] p-5";

function daysLeftLabel(dueDate) {
  const days = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86_400_000);
  if (days > 1) return `${days} days left`;
  if (days === 1) return "1 day left";
  if (days === 0) return "Due today";
  return `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} overdue`;
}

export default function ProjectOverviewStats({ tasks, milestone }) {
  const count = (id) => tasks.byStatus.find((s) => s.id === id)?.count ?? 0;
  const total = tasks.byStatus.reduce((sum, s) => sum + s.count, 0);
  const done = count("done");
  const pct = total ? Math.round((done / total) * 100) : 0;

  const tiles = [
    { label: "Total tasks", value: total, hint: "Across all columns", icon: ListChecks, color: "#6C7BFF" },
    { label: "Completed", value: done, hint: `${pct}% of all tasks`, icon: CheckCircle2, color: "#5FD3A0" },
    { label: "In progress", value: count("in_progress"), hint: `${count("review")} more in review`, icon: Clock, color: "#C9A8FF" },
    {
      label: "Overdue",
      value: tasks.overdue,
      hint: tasks.overdue > 0 ? "Past their deadline" : "Nothing overdue",
      icon: AlertTriangle,
      color: tasks.overdue > 0 ? "#EF4444" : "#8B86B8",
    },
  ];

  return (
    <section aria-label="Project overview" className="flex flex-col gap-4">
      <div className={card}>
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
          <div>
            <h2 className="text-sm font-semibold text-[#F5F5F5]">Project progress</h2>
            <p className="mt-0.5 text-xs text-[#6B6890]">
              {total ? `${done} of ${total} tasks done` : "No tasks yet"}
            </p>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-[#F5F5F5]">{pct}%</p>
        </div>

        <div
          role="progressbar"
          aria-label="Project completion"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="mt-4 h-2 overflow-hidden rounded-full bg-[#1D1A40]"
        >
          <div className="h-full rounded-full bg-[#6C7BFF]" style={{ width: `${pct}%` }} />
        </div>

        {milestone && (
          <p className="mt-3 flex items-center gap-2 text-xs text-[#A9A6C8]">
            <Flag size={13} className="text-[#C9A8FF]" aria-hidden="true" />
            <span>
              {milestone.name} · {daysLeftLabel(milestone.dueDate)}
            </span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {tiles.map(({ label, value, hint, icon: Icon, color }) => (
          <div key={label} className={`${card} !p-4`}>
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#8B86B8]">{label}</p>
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${color}1A`, color }}
              >
                <Icon size={15} />
              </span>
            </div>
            <p className="mt-3 text-2xl font-semibold tabular-nums text-[#F5F5F5]">{value}</p>
            <p className="mt-1 text-xs text-[#6B6890]">{hint}</p>
          </div>
        ))}
      </div>
    </section>
  );
}