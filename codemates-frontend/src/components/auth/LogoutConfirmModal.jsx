import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, X } from "lucide-react";

import Button from "src/components/ui/Button";
import useAuth from "src/hooks/useAuth";
import sadCapybara from "src/assets/sad_capybara.jpg";

/**
 * LogoutConfirmModal
 *
 * "Are you sure you want to log out?" confirmation, styled after the
 * app's existing self-contained modals (AddResourceModal, etc.) rather
 * than the standalone blue reference mock — same dark surface, same
 * border tokens — so it doesn't look like a different app.
 *
 * This is an overlay component, not a page: it does NOT have its own
 * route. It expects to be mounted (with `open` state) from wherever the
 * "Sign out" action lives — e.g. the navbar's account menu — so it can
 * pop up over whatever page the user is already on, rather than
 * navigating them away to a blank /logout route first.
 *
 * Calls useAuth().logout() itself on confirm (real backend call — the
 * httpOnly session cookie can only be cleared server-side) and, once
 * it resolves, navigates to /logged-out. If logout fails, the error is
 * shown inline instead of navigating away, since navigating on failure
 * would hide a session that's still technically active.
 *
 * Props:
 * - open      boolean
 * - onClose   () => void — called for "Naah, Just Kidding" / Escape / backdrop
 */
export default function LogoutConfirmModal({ open, onClose }) {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return undefined;
    setError(null);
    setLoggingOut(false);

    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleConfirm() {
    setLoggingOut(true);
    setError(null);
    try {
      await logout();
      navigate("/logged-out");
    } catch (err) {
      setError(err?.message || "Couldn't log you out. Try again.");
      setLoggingOut(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
        onClick={loggingOut ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6 text-center"
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loggingOut}
          aria-label="Close"
          className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--cm-muted)] transition-colors hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={16} />
        </button>

        <img
          src={sadCapybara}
          alt=""
          className="h-32 w-32 rounded-xl object-cover"
        />

        <div>
          <h2 id="logout-confirm-title" className="text-base font-semibold text-[var(--cm-text)]">
            Oh no! You're leaving...
          </h2>
          <p className="mt-1 text-sm text-[var(--cm-text-dim)]">
            Are you sure you want to log out?
          </p>
        </div>

        {error && (
          <p className="w-full rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {error}
          </p>
        )}

        <div className="flex w-full flex-col gap-2">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            disabled={loggingOut}
            className="w-full"
          >
            Naah, Just Kidding
          </Button>
          <Button
            type="button"
            variant="ghost"
            leftIcon={LogOut}
            onClick={handleConfirm}
            disabled={loggingOut}
            className="w-full !text-red-300 hover:!bg-red-500/10"
          >
            {loggingOut ? "Logging out..." : "Yes, Log Me Out"}
          </Button>
        </div>
      </div>
    </div>
  );
}