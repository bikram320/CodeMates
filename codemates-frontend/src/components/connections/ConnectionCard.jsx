import { ArrowRight, Ban, Check, UserMinus, X } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import SkillBadge from "../developer/SkillBadge";

/**
 * Card for one person in the Connections page — covers both real
 * contexts (an existing connection, an incoming request) via `mode`.
 *
 * "outgoing" mode was removed — the real social-service API has no way
 * to fetch requests you've sent (see connectionsApi.js), so there's
 * nothing to render that mode with. "block" is real (PUT .../block,
 * either party) and available in both remaining modes via `onBlock`.
 *
 * View Profile links to /connections/developers/:username (a second
 * route alias for the same DeveloperProfile page, see AppRoutes.jsx) so
 * the sidebar/back-link can tell "came from Connections" apart from
 * "came from Discover" purely from the URL.
 *
 * Props:
 * - developer   { id, name, username, avatarUrl, skills, experienceLevel,
 *                 isOpenToCollaborate, activityStatus }
 * - mode        "connection" | "incoming"
 * - meta        string — small caption, e.g. "Connected since Jul 2026"
 * - onAccept, onReject   used when mode="incoming"
 * - onRemove             used when mode="connection"
 * - onBlock              optional, either mode — omit to hide the button
 */
const MODE_LABEL = {
  incoming: "Wants to connect",
};

export default function ConnectionCard({
                                         developer,
                                         mode = "connection",
                                         meta,
                                         onAccept,
                                         onReject,
                                         onRemove,
                                         onBlock,
                                         className = "",
                                       }) {
  if (!developer) return null;

  const statusLabel = developer.isOpenToCollaborate
      ? "Available"
      : developer.activityStatus || "Unavailable";

  return (
      <Card hoverable padding="md" className={`flex flex-col gap-3 ${className}`}>
        <div className="flex items-center gap-3">
          <Avatar name={developer.name} src={developer.avatarUrl} size={36} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-[var(--cm-text)]">
              {developer.name}
            </h3>
            <p className="truncate text-xs text-[var(--cm-muted)]">
              @{developer.username}
            </p>
          </div>
          {MODE_LABEL[mode] && (
              <Badge variant="outline" className="shrink-0 text-[10px]">
                {MODE_LABEL[mode]}
              </Badge>
          )}
        </div>

        {(developer.experienceLevel || developer.isOpenToCollaborate !== undefined) && (
            <div className="flex items-center gap-2">
              {developer.experienceLevel && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cm-text-dim)]">
              {developer.experienceLevel}
            </span>
              )}
              {developer.isOpenToCollaborate !== undefined && (
                  <Badge variant={developer.isOpenToCollaborate ? "soft" : "neutral"}>
                    {statusLabel}
                  </Badge>
              )}
            </div>
        )}

        {developer.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {developer.skills.map((skill) => (
                  <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
        )}

        {meta && <p className="text-xs text-[var(--cm-muted)]">{meta}</p>}

        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Button
              to={`/connections/developers/${developer.username}`}
              variant="secondary"
              size="sm"
              className="gap-1.5"
          >
            View Profile <ArrowRight size={14} />
          </Button>

          {mode === "incoming" && (
              <>
                <Button variant="primary" size="sm" leftIcon={Check} onClick={onAccept}>
                  Accept
                </Button>
                <Button variant="ghost" size="sm" leftIcon={X} onClick={onReject}>
                  Reject
                </Button>
              </>
          )}

          {mode === "connection" && (
              <Button variant="ghost" size="sm" leftIcon={UserMinus} onClick={onRemove}>
                Remove
              </Button>
          )}

          {onBlock && (
              <Button variant="ghost" size="sm" leftIcon={Ban} onClick={onBlock} className="ml-auto">
                Block
              </Button>
          )}
        </div>
      </Card>
  );
}