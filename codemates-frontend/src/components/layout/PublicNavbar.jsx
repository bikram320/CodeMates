import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, Menu, X } from "lucide-react";
import Logo from "../ui/Logo";

/**
 * Navbar for public pages: Landing, Login, Register, Forgot/Reset Password.
 *
 * Nav structure is fixed (not array-configurable like before) since it's
 * now semantically specific rather than a generic link list:
 * - "discover" opens a small dropdown (Developers / Projects) — same
 *   click-toggle + outside-click-close pattern as the authenticated
 *   Navbar's profile menu, reused here for consistency rather than
 *   inventing a second dropdown implementation.
 * - "how it works" scrolls to #how-it-works. On the landing page it
 *   scrolls directly; from any other public page it navigates to
 *   "/#how-it-works" first — Landing.jsx picks up the hash on mount and
 *   scrolls once that section actually exists.
 *
 * Props:
 * - signInTo, getStartedTo   route overrides
 * - logoSrc                  optional image logo
 */

const DISCOVER_ITEMS = [
  { label: "Developers", to: "/discover/developers" },
  { label: "Projects", to: "/discover/projects" },
];

const linkBase =
  "font-[var(--cm-font-sans)] text-lg transition-colors hover:text-[var(--cm-text)]";
const ctaClass =
  "rounded-md bg-[var(--cm-indigo)] px-5 py-2.5 font-[var(--cm-font-mono)] text-lg text-white transition-colors hover:bg-[var(--cm-indigo-hover)]";

export default function PublicNavbar({
  signInTo = "/login",
  getStartedTo = "/register",
  logoSrc = null,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const discoverRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!discoverOpen) return undefined;

    function handleClick(event) {
      if (discoverRef.current && !discoverRef.current.contains(event.target)) {
        setDiscoverOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === "Escape") setDiscoverOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [discoverOpen]);

  function handleHowItWorksClick(event) {
    event.preventDefault();
    setMobileOpen(false);
    if (location.pathname === "/") {
      document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
    } else {
      navigate("/#how-it-works");
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--cm-border)] bg-[var(--cm-bg)]/95 backdrop-blur">
      <div className="flex h-[var(--cm-navbar-h)] w-full items-center justify-between px-4 sm:px-6 lg:px-10">
        <Logo to="/" size="md" src={logoSrc} />

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          <div className="relative" ref={discoverRef}>
            <button
              type="button"
              onClick={() => setDiscoverOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={discoverOpen}
              className={`flex items-center gap-1 ${linkBase} text-[var(--cm-text-dim)] hover:text-[var(--cm-text)]`}
            >
              discover
              <ChevronDown
                size={14}
                className={`transition-transform ${discoverOpen ? "rotate-180" : ""}`}
              />
            </button>

            {discoverOpen && (
              <div
                role="menu"
                className="absolute left-0 mt-2 w-48 overflow-hidden rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] py-1 shadow-xl shadow-black/40"
              >
                {DISCOVER_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    role="menuitem"
                    onClick={() => setDiscoverOpen(false)}
                    className="block px-3 py-2 text-sm text-[var(--cm-text-dim)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          <a
            href="#how-it-works"
            onClick={handleHowItWorksClick}
            className={`${linkBase} text-[var(--cm-text-dim)]`}
          >
            how it works
          </a>
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
          onClick={() => setMobileOpen((v) => !v)}
          aria-expanded={mobileOpen}
          aria-controls="public-mobile-menu"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-[var(--cm-text-dim)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)] md:hidden"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          id="public-mobile-menu"
          className="border-t border-[var(--cm-border)] bg-[var(--cm-bg)] md:hidden"
        >
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-4 sm:px-6">
            <p className="px-3 pt-2 text-xs uppercase tracking-wide text-[var(--cm-muted)]">
              Discover
            </p>
            {DISCOVER_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-[var(--cm-indigo-soft)] text-[var(--cm-text)]"
                      : "text-[var(--cm-text-dim)] hover:bg-[var(--cm-surface)]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            <a
              href="#how-it-works"
              onClick={handleHowItWorksClick}
              className="rounded-md px-3 py-2.5 text-sm text-[var(--cm-text-dim)] hover:bg-[var(--cm-surface)]"
            >
              how it works
            </a>

            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--cm-border)] pt-4">
              <NavLink
                to={signInTo}
                onClick={() => setMobileOpen(false)}
                className="rounded-md border border-[var(--cm-border)] px-4 py-2.5 text-center text-sm text-[var(--cm-text-dim)] transition-colors hover:text-[var(--cm-text)]"
              >
                sign in
              </NavLink>
              <NavLink
                to={getStartedTo}
                onClick={() => setMobileOpen(false)}
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