import { useEffect, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Compass,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  User,
  X,
} from "lucide-react";
import Logo from "src/components/ui/Logo";



const DEFAULT_LINKS = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Discover", to: "/discover/developers", icon: Compass },
  { label: "Projects", to: "/projects", icon: LayoutDashboard },
  { label: "Messages", to: "/messages", icon: MessageSquare },
];

const DEFAULT_MENU_ITEMS = [
  { label: "Profile", to: "/profile", icon: User },
  { label: "Sign out", to: "/logout", icon: LogOut, danger: true },
];

/** Small avatar with initials fallback. Kept local until a ui/Avatar exists. */
function Avatar({ name = "", src = null, size = 32 }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className="inline-flex items-center justify-center rounded-full bg-[var(--cm-indigo-soft)] text-xs font-medium text-[var(--cm-lavender)]"
    >
      {initials || "?"}
    </span>
  );
}

export default function Navbar({
  links = DEFAULT_LINKS,
  user = { name: "", role: "", avatarUrl: null },
  notificationCount = 0,
  onNotificationsClick,
  menuItems = DEFAULT_MENU_ITEMS,
  onMenuToggle,
  logoSrc = null,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the profile dropdown on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;

    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen]);

  const navLinkClass = ({ isActive }) =>
    `rounded-[var(--cm-radius-sm)] px-3 py-2 text-base transition-colors ${
      isActive
        ? "bg-[var(--cm-indigo-soft)] text-[var(--cm-text)]"
        : "text-[var(--cm-text-dim)] hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--cm-border)] bg-[var(--cm-bg)]">
      <div className="flex h-[var(--cm-navbar-h)] items-center gap-3 px-4 sm:px-5">
        {/* Drawer toggle — only useful when a sidebar is present */}
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Toggle sidebar"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--cm-text-dim)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)] lg:hidden"
          >
            <Menu size={20} />
          </button>
        )}

        <Logo to="/dashboard" size="sm" src={logoSrc} />

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onNotificationsClick}
            aria-label={
              notificationCount > 0
                ? `Notifications, ${notificationCount} unread`
                : "Notifications"
            }
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--cm-text-dim)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
          >
            <Bell size={21} />
            {notificationCount > 0 && (
              <span className="absolute right-1 top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--cm-indigo)] px-1 text-[10px] font-medium text-white">
                {notificationCount > 9 ? "9+" : notificationCount}
              </span>
            )}
          </button>

          {/* Profile dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-md p-1 pr-2 transition-colors hover:bg-[var(--cm-surface)]"
            >
              <Avatar name={user.name} src={user.avatarUrl} size={36} />
              <span className="hidden text-base text-[var(--cm-text-dim)] sm:block">
                {user.name}
              </span>
              <ChevronDown size={15} className="text-[var(--cm-muted)]" />
            </button>

            {menuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-2 w-56 overflow-hidden rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface)] py-1 shadow-xl shadow-black/40"
              >
                <div className="border-b border-[var(--cm-border)] px-3 py-3">
                  <p className="text-sm text-[var(--cm-text)]">{user.name}</p>
                  {user.role && (
                    <p className="mt-0.5 text-xs text-[var(--cm-muted)]">
                      {user.role}
                    </p>
                  )}
                </div>

                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const classes = `flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-[var(--cm-surface-2)] ${
                    item.danger
                      ? "text-[var(--cm-lavender)]"
                      : "text-[var(--cm-text-dim)]"
                  }`;

                  if (item.onClick) {
                    return (
                      <button
                        key={item.label}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          item.onClick();
                        }}
                        className={classes}
                      >
                        {Icon && <Icon size={16} />}
                        {item.label}
                      </button>
                    );
                  }

                  return (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className={classes}
                    >
                      {Icon && <Icon size={16} />}
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mobile nav toggle for the top-level links */}
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--cm-text-dim)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)] md:hidden"
          >
            {mobileOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className="flex flex-col gap-1 border-t border-[var(--cm-border)] px-4 py-3 md:hidden">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--cm-indigo-soft)] text-[var(--cm-text)]"
                      : "text-[var(--cm-text-dim)] hover:bg-[var(--cm-surface)]"
                  }`
                }
              >
                {Icon && <Icon size={17} />}
                {link.label}
              </NavLink>
            );
          })}
        </nav>
      )}
    </header>
  );
}