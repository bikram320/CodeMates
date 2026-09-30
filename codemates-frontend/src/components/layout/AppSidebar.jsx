import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Compass,
  FolderGit2,
  LayoutDashboard,
  MessageSquare,
  Users,
  UserGroup
} from "lucide-react";



const DEFAULT_ITEMS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  {
    label: "Discover",
    icon: Compass,
    children: [
      { label: "Developers", to: "/discover/developers", icon: UserGroup },
      { label: "Projects", to: "/discover/projects", icon: FolderGit2 },
    ],
  },
  { label: "My Projects", to: "/projects", icon: FolderGit2 },
  { label: "Connections", to: "/connections", icon: Users },
  { label: "Messages", to: "/messages", icon: MessageSquare },
  { label: "Notifications", to: "/notifications", icon: Bell },
];

function itemClass(isActive) {
  return `group flex w-full items-center gap-2.5 rounded-[var(--cm-radius-sm)] px-2.5 py-1.5 text-sm transition-colors ${
    isActive
      ? "bg-[var(--cm-indigo-soft)] text-[var(--cm-text)]"
      : "text-[var(--cm-text-dim)] hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
  }`;
}

export default function AppSidebar({
  items = DEFAULT_ITEMS,
  collapsed = false,
  footer = null,
  onNavigate,
  className = "",
}) {
  // Groups with children start expanded; the user can fold them away.
  const [openGroups, setOpenGroups] = useState(() =>
    items.filter((item) => item.children).map((item) => item.label)
  );

  const toggleGroup = (label) =>
    setOpenGroups((current) =>
      current.includes(label)
        ? current.filter((name) => name !== label)
        : [...current, label]
    );

  return (
    <aside
      style={{
        width: collapsed
          ? "var(--cm-sidebar-w-collapsed)"
          : "var(--cm-sidebar-w)",
      }}
      className={`flex h-full shrink-0 flex-col border-r border-[var(--cm-border)] bg-[var(--cm-bg)] ${className}`}
    >
      <nav className="flex-1 overflow-y-auto p-2.5">
        <ul className="flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = item.icon;

            // Group with sub-items
            if (item.children) {
              const isOpen = openGroups.includes(item.label);

              return (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.label)}
                    aria-expanded={isOpen}
                    title={collapsed ? item.label : undefined}
                    className={itemClass(false)}
                  >
                    {Icon && <Icon size={18} className="shrink-0" />}
                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        <ChevronDown
                          size={15}
                          className={`text-[var(--cm-muted)] transition-transform ${
                            isOpen ? "" : "-rotate-90"
                          }`}
                        />
                      </>
                    )}
                  </button>

                  {isOpen && !collapsed && (
                    <ul className="mt-0.5 ml-[26px] flex flex-col gap-0.5 border-l border-[var(--cm-border)] pl-2">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              onClick={onNavigate}
                              className={({ isActive }) => itemClass(isActive)}
                            >
                              {ChildIcon && (
                                <ChildIcon size={16} className="shrink-0" />
                              )}
                              <span>{child.label}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {/* Collapsed rail still needs the children reachable */}
                  {collapsed && (
                    <ul className="mt-0.5 flex flex-col gap-0.5">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <li key={child.to}>
                            <NavLink
                              to={child.to}
                              onClick={onNavigate}
                              title={child.label}
                              className={({ isActive }) => itemClass(isActive)}
                            >
                              {ChildIcon && (
                                <ChildIcon size={16} className="shrink-0" />
                              )}
                              <span className="sr-only">{child.label}</span>
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            }

            // Plain link
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) => itemClass(isActive)}
                >
                  {Icon && <Icon size={18} className="shrink-0" />}
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-[var(--cm-indigo)] px-1.5 py-0.5 text-[10px] font-medium text-white">
                          {item.badge}
                        </span>
                      ) : null}
                    </>
                  )}
                  {collapsed && <span className="sr-only">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {footer && !collapsed && (
        <div className="border-t border-[var(--cm-border)] p-3">{footer}</div>
      )}
    </aside>
  );
}