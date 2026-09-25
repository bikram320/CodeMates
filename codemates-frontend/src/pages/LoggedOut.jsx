import { Link } from "react-router-dom";

import sleepyCapybara from "src/assets/sleepy_capybara.jpg";

import Logo from "src/components/ui/Logo";

/**
 * LoggedOut page (/logged-out) — shown after a successful sign-out.
 *
 * Adapted from the two-tone hero reference into the app's existing dark
 * theme (var(--cm-*) tokens) rather than a light/black split, so it
 * matches the rest of the product instead of looking like a separate
 * template. The brand blue used for the logo wordmark below is sampled
 * directly from codemates_logo.png (#4A5BF9) rather than guessed.
 */
export default function LoggedOut() {
  return (
    <div className="flex min-h-[calc(100svh-var(--cm-navbar-h))] w-full flex-col items-center justify-center gap-10 bg-[var(--cm-surface)] px-6 py-16 text-center">
      <div className="flex items-center gap-2.5">
        <Logo to="/" size="md" src={sleepyCapybara} />
      </div>

      <img
        src={sleepyCapybara}
        alt=""
        className="h-48 w-48 rounded-2xl border border-[var(--cm-border)] object-cover"
      />

      <div className="max-w-md">
        <h1 className="text-3xl font-bold text-[var(--cm-text)]">
          You've been logged out.
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-[var(--cm-text-dim)]">
          Come back anytime — your projects, team, and tasks will be right
          where you left them.
        </p>
      </div>

      <Link
        to="/login"
        className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-[var(--cm-text)] transition-colors"
        style={{ backgroundColor: "#4A5BF9" }}
      >
        Log back in
      </Link>
    </div>
  );
}