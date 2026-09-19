import { MapPin } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

/**
 * Hero section for a developer's profile page: avatar, identity, quick
 * status badges, and the primary "Connect" call to action.
 *
 * Props:
 * - name, username, avatarUrl   identity (required)
 * - tagline, location           optional supporting text
 * - experienceLevel, availability   shown as badges
 * - onConnect    click handler for the Connect button
 * - connected    boolean — swaps the button to a "Connected" state
 */
const AVAILABILITY_VARIANT = {
  Available: "soft",
  "Open to offers": "outline",
  "Not available": "neutral",
};

export default function ProfileHeader({
  name,
  username,
  avatarUrl,
  tagline,
  location,
  experienceLevel,
  availability,
  onConnect,
  connected = false,
  className = "",
}) {
  return (
    <div
      className={`flex flex-col gap-5 rounded-lg border border-[var(--cm-border)] bg-[var(--cm-surface-2)] p-6 sm:flex-row sm:items-start sm:justify-between ${className}`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <img
          src={avatarUrl}
          alt={name}
          className="h-20 w-20 shrink-0 rounded-full object-cover"
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

      <Button
        variant={connected ? "secondary" : "primary"}
        onClick={onConnect}
        className="shrink-0"
      >
        {connected ? "Connected" : "Connect"}
      </Button>
    </div>
  );
}