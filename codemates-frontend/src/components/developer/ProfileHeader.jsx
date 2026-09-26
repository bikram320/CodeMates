import { useEffect, useRef, useState } from "react";
import { MapPin, MessageCircle, UserMinus } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";

/**
 * Hero section for a developer's profile page: avatar, identity, quick
 * status badges, and the connection action.
 *
 * avatarUrl isn't actually populated by the backend today, so the avatar
 * uses the shared <Avatar /> component: a real image if one's ever present,
 * otherwise a colored circle with the developer's first initial — same
 * treatment as the Discover Developers cards, see Avatar.jsx.
 *
 * The connection action is fully driven by `connectionState` (from
 * useProfileConnection — see that hook for why it takes more than one
 * backend call to resolve) rather than a local boolean:
 *   - 'NONE'             → "Connect"
 *   - 'PENDING_OUTGOING'  → disabled "Request sent" (no cancel — backend gap, see hook)
 *   - 'PENDING_INCOMING'  → "Accept" / "Decline"
 *   - 'ACCEPTED'          → "Connected" opens a small menu: Message + Remove
 *                           connection (remove asks for confirmation INLINE
 *                           in the menu, not via window.confirm — that's
 *                           what this replaces)
 *   - 'BLOCKED'           → disabled "Blocked"
 *   - 'LOADING'           → disabled "…"
 *   - 'ERROR'             → "Retry"
 *   - 'UNAVAILABLE'       → nothing rendered (no id to act on — see hook)
 *
 * Props:
 * - name, username, avatarUrl   identity (required)
 * - tagline, location           optional supporting text
 * - experienceLevel, availability   shown as badges
 * - connectionState  one of the states listed above
 * - onConnect / onAccept / onReject / onRemove / onRetry   handlers for each state's action
 * - onMessage   handler for the "Message" menu item (only shown when ACCEPTED)
 * - isActing   true while a connection action is in flight (disables buttons)
 * - connectionError   error message from the last failed action, if any
 */
const AVAILABILITY_VARIANT = {
  Available: "soft",
  "Open to offers": "outline",
  "Not available": "neutral",
};

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handlePointerDown(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [ref, onOutside]);
}

const menuItemClass =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--cm-surface)]";

/** The "Connected" button's dropdown: Message + Remove connection (with an inline confirm step). */
function ConnectedMenu({ onMessage, onRemove, isActing }) {
  const [open, setOpen] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const containerRef = useRef(null);

  const close = () => {
    setOpen(false);
    setConfirmingRemove(false);
  };

  useClickOutside(containerRef, close);

  return (
      <div ref={containerRef} className="relative">
        <Button
            variant="secondary"
            disabled={isActing}
            onClick={() => setOpen((o) => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
        >
          {isActing ? "Working…" : "Connected"}
        </Button>

        {open && (
            <div
                role="menu"
                className="absolute right-0 top-full z-10 mt-1.5 w-56 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-1.5 shadow-lg"
            >
              {!confirmingRemove ? (
                  <>
                    {onMessage && (
                        <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              close();
                              onMessage();
                            }}
                            className={`${menuItemClass} text-[var(--cm-text-dim)] hover:text-[var(--cm-text)]`}
                        >
                          <MessageCircle size={15} />
                          Message
                        </button>
                    )}
                    <button
                        type="button"
                        role="menuitem"
                        onClick={() => setConfirmingRemove(true)}
                        className={`${menuItemClass} text-red-300 hover:text-red-200`}
                    >
                      <UserMinus size={15} />
                      Remove connection
                    </button>
                  </>
              ) : (
                  <div className="p-2">
                    <p className="mb-2 text-xs text-[var(--cm-text-dim)]">
                      Remove this connection?
                    </p>
                    <div className="flex justify-end gap-2">
                      <button
                          type="button"
                          onClick={() => setConfirmingRemove(false)}
                          className="rounded-md px-2.5 py-1 text-xs text-[var(--cm-text-dim)] hover:bg-[var(--cm-surface)] hover:text-[var(--cm-text)]"
                      >
                        Cancel
                      </button>
                      <button
                          type="button"
                          onClick={() => {
                            onRemove?.();
                            close();
                          }}
                          className="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-300 hover:bg-red-500/20"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
              )}
            </div>
        )}
      </div>
  );
}

function ConnectionAction({
                            connectionState,
                            onConnect,
                            onAccept,
                            onReject,
                            onRemove,
                            onRetry,
                            onMessage,
                            isActing,
                          }) {
  switch (connectionState) {
    case "ACCEPTED":
      return (
          <ConnectedMenu onMessage={onMessage} onRemove={onRemove} isActing={isActing} />
      );

    case "PENDING_OUTGOING":
      return (
          <Button variant="secondary" disabled>
            Request sent
          </Button>
      );

    case "PENDING_INCOMING":
      return (
          <div className="flex gap-2">
            <Button variant="primary" disabled={isActing} onClick={onAccept}>
              {isActing ? "Accepting…" : "Accept"}
            </Button>
            <Button variant="outline" disabled={isActing} onClick={onReject}>
              Decline
            </Button>
          </div>
      );

    case "BLOCKED":
      return (
          <Button variant="secondary" disabled>
            Blocked
          </Button>
      );

    case "ERROR":
      return (
          <Button variant="outline" onClick={onRetry}>
            Retry
          </Button>
      );

    case "LOADING":
      return (
          <Button variant="secondary" disabled>
            …
          </Button>
      );

    case "UNAVAILABLE":
      return null;

    case "NONE":
    default:
      return (
          <Button variant="primary" disabled={isActing} onClick={onConnect}>
            {isActing ? "Sending…" : "Connect"}
          </Button>
      );
  }
}

export default function ProfileHeader({
                                        name,
                                        username,
                                        avatarUrl,
                                        tagline,
                                        location,
                                        experienceLevel,
                                        availability,
                                        connectionState = "UNAVAILABLE",
                                        onConnect,
                                        onAccept,
                                        onReject,
                                        onRemove,
                                        onRetry,
                                        onMessage,
                                        isActing = false,
                                        connectionError,
                                        className = "",
                                      }) {
  return (
      <div
          className={`flex flex-col gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6 sm:flex-row sm:items-start sm:justify-between ${className}`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <Avatar
              name={name}
              username={username}
              avatarUrl={avatarUrl}
              className="h-20 w-20 text-2xl"
          />

          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-[var(--cm-text)]">
              {name}
            </h1>
            <p className="text-sm text-[var(--cm-muted)]">@{username}</p>

            {tagline && (
                <p className="mt-2 max-w-md text-sm text-[var(--cm-text-dim)]">
                  {tagline}
                </p>
            )}

            {location && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--cm-muted)]">
                  <MapPin size={13} />
                  {location}
                </p>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {experienceLevel && (
                  <Badge variant="neutral">{experienceLevel}</Badge>
              )}
              {availability && (
                  <Badge variant={AVAILABILITY_VARIANT[availability] ?? "neutral"}>
                    {availability}
                  </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <ConnectionAction
              connectionState={connectionState}
              onConnect={onConnect}
              onAccept={onAccept}
              onReject={onReject}
              onRemove={onRemove}
              onRetry={onRetry}
              onMessage={onMessage}
              isActing={isActing}
          />
          {connectionError && (
              <p role="alert" className="max-w-[220px] text-right text-xs text-red-300">
                {connectionError}
              </p>
          )}
        </div>
      </div>
  );
}