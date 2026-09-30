import { NavLink, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Files,
  User,
  LayoutDashboard,
  ListTodo,
  MessageSquare,
  Users,
  UserGroup
} from "lucide-react";
import BackButton from "../ui/BackButton";


const DEFAULT_ITEMS = [
  { label: "Overview", path: "", icon: LayoutDashboard, end: true },
  { label: "Tasks", path: "/tasks", icon: ListTodo },
  { label: "Team", path: "/team", icon: Users },
  { label: "Chat", path: "/chat", icon: MessageSquare },
  { label: "Resources", path: "/resources", icon: Files },
  { label: "Contributions", path: "/contributions", icon: UserGroup },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "GitHub", path: "/github", icon: User },
];

export default function ProjectSidebar({
                                         project = { id: "", name: "", role: "", visibility: "" },
                                         basePath,
                                         items = DEFAULT_ITEMS,
                                         backLabel = "All projects",
                                         onNavigate,
                                         className = "",
                                       }) {
  const root = basePath || `/projects/${project.id}`;
  const navigate = useNavigate();

  // Previously this was onClick={onNavigate} — on desktop onNavigate is
  // undefined (it's only passed for the mobile drawer's close-on-navigate
  // case), so BackButton fell through to its own default, which is
  // browser-history-back, i.e. "wherever you were last," not necessarily
  // My Projects. Always route to /projects explicitly instead, and still
  // close the drawer on mobile when onNavigate is present.
  function handleBack() {
    onNavigate?.();
    navigate("/projects");
  }

  // First letter of the project name, used as a compact project mark.
  const mark = (project.name || "?").trim().charAt(0).toUpperCase();

  return (
      <aside
          style={{ width: "var(--cm-sidebar-w)" }}
          className={`flex h-full shrink-0 flex-col border-r border-[var(--cm-border)] bg-[var(--cm-bg)] ${className}`}
      >
        <div className="border-b border-[var(--cm-border)] p-3">
          <BackButton
              label={backLabel}
              onClick={handleBack}
              className="mb-3 text-xs text-[var(--cm-muted)] hover:text-[var(--cm-text-dim)]"
          />

          <div className="flex items-start gap-2.5">
          <span
              aria-hidden="true"
              className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--cm-indigo-soft)] text-sm font-semibold text-[var(--cm-lavender)]"
          >
            {mark}
          </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-medium text-[var(--cm-text)]">
                {project.name}
              </h2>
              {(project.role || project.visibility) && (
                  <p className="mt-0.5 truncate text-xs text-[var(--cm-muted)]">
                    {[project.role, project.visibility].filter(Boolean).join(" · ")}
                  </p>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-2.5">
          <ul className="flex flex-col gap-0.5">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                  <li key={item.label}>
                    <NavLink
                        to={`${root}${item.path}`}
                        end={item.end}
                        onClick={onNavigate}
                        className={({ isActive }) =>
                            `flex items-center gap-2.5 rounded-[var(--cm-radius-sm)] px-2.5 py-1.5 text-sm transition-colors ${
                                isActive
                                    ? "bg-[var(--cm-indigo-soft)] text-[var(--cm-text)]"
                                    : "text-[var(--cm-text-dim)] hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
                            }`
                        }
                    >
                      {Icon && <Icon size={18} className="shrink-0" />}
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                          <span className="rounded-full border border-[var(--cm-border-strong)] px-1.5 py-0.5 text-[10px] text-[var(--cm-text-dim)]">
                      {item.badge}
                    </span>
                      ) : null}
                    </NavLink>
                  </li>
              );
            })}
          </ul>
        </nav>
      </aside>
  );
}