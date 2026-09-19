import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Logo from "src/components/ui/Logo";



const DEFAULT_LINKS = [
  { label: "discover", to: "/discover" },
  { label: "projects", to: "/projects" },
  { label: "how it works", to: "/how-it-works" },
];

// Shared class strings, declared once so the desktop and mobile menus agree.
const linkBase =
  "font-[var(--cm-font-sans)] text-sm transition-colors hover:text-[var(--cm-text)]";
const ctaClass =
  "rounded-md bg-[var(--cm-indigo)] px-4 py-2 font-[var(--cm-font-mono)] text-sm text-white transition-colors hover:bg-[var(--cm-indigo-hover)]";

export default function PublicNavbar({
  links = DEFAULT_LINKS,
  signInTo = "/login",
  getStartedTo = "/register",
  logoSrc = null,
}) {
  const [open, setOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `${linkBase} ${
      isActive ? "text-[var(--cm-text)]" : "text-[var(--cm-text-dim)]"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--cm-border)] bg-[var(--cm-bg)]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo to="/" size="md" src={logoSrc} />

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <NavLink to={signInTo} className={`${linkBase} text-[var(--cm-text-dim)]`}>
            sign in
          </NavLink>
          <NavLink to={getStartedTo} className={ctaClass}>
            get started
          </NavLink>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="public-mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--cm-text-dim)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)] md:hidden"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          id="public-mobile-menu"
          className="border-t border-[var(--cm-border)] bg-[var(--cm-bg)] md:hidden"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--cm-indigo-soft)] text-[var(--cm-text)]"
                      : "text-[var(--cm-text-dim)] hover:bg-[var(--cm-surface)]"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--cm-border)] pt-4">
              <NavLink
                to={signInTo}
                onClick={() => setOpen(false)}
                className="rounded-md border border-[var(--cm-border)] px-4 py-2.5 text-center text-sm text-[var(--cm-text-dim)] transition-colors hover:text-[var(--cm-text)]"
              >
                sign in
              </NavLink>
              <NavLink
                to={getStartedTo}
                onClick={() => setOpen(false)}
                className={`${ctaClass} text-center`}
              >
                get started
              </NavLink>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}