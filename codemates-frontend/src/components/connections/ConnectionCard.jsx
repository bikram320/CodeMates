import { Ban, Check, UserMinus, X } from "lucide-react";
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
 * Deliberately built from the same primitives DeveloperCard uses
 * (SkillBadge, Badge, Button, Card) rather than wrapping DeveloperCard
 * itself — the action buttons here are unlike anything DeveloperCard
 * supports.
 *
 * Props:
 * - developer   { id, name, username, avatarUrl, skills, role }
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

  return (
      <Card hoverable padding="md" className={`flex flex-col gap-4 ${className}`}>
        <div className="flex items-start gap-3">
          <Avatar name={developer.name} src={developer.avatarUrl} size={44} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-[var(--cm-text)]">
              {developer.name}
            </h3>
            <p className="truncate text-xs text-[var(--cm-muted)]">
              @{developer.username}
            </p>
            {developer.role && (
                <p className="mt-0.5 truncate text-xs text-[var(--cm-text-dim)]">
                  {developer.role}
                </p>
            )}
          </div>
          {MODE_LABEL[mode] && (
              <Badge variant="outline" className="shrink-0">
                {MODE_LABEL[mode]}
              </Badge>
          )}
        </div>

        {developer.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {developer.skills.map((skill) => (
                  <SkillBadge key={skill} skill={skill} />
              ))}
            </div>
        )}

        {meta && <p className="text-xs text-[var(--cm-muted)]">{meta}</p>}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Button
              to={`/connections/developers/${developer.username}`}
              variant="secondary"
              size="sm"
          >
            View Profile
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
              <Button variant="ghost" size="sm" leftIcon={Ban} onClick={onBlock}>
                Block
              </Button>
          )}
        </div>
      </Card>
  );
}