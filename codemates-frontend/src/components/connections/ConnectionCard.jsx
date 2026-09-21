import { Check, UserMinus, X } from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Avatar from "../ui/Avatar";
import SkillBadge from "../developer/SkillBadge";

/**
 * Card for one person in the Connections page — covers all three
 * contexts (an existing connection, an incoming request, an outgoing
 * request) via `mode`, rather than three near-duplicate components.
 *
 * Deliberately built from the same primitives DeveloperCard uses
 * (SkillBadge, Badge, Button, Card) rather than wrapping DeveloperCard
 * itself — the action buttons here (Accept/Reject/Remove/Cancel) are
 * unlike anything DeveloperCard supports, so composing from the shared
 * pieces avoided bolting connection-specific logic onto a component
 * built for a different page.
 *
 * Props:
 * - developer   { id, name, username, avatarUrl, skills, role }
 * - mode        "connection" | "incoming" | "outgoing"
 * - meta        string — small caption, e.g. "Connected since Jul 2026"
 * - onAccept, onReject   used when mode="incoming"
 * - onCancel             used when mode="outgoing"
 * - onRemove             used when mode="connection"
 */
const MODE_LABEL = {
  incoming: "Wants to connect",
  outgoing: "Request sent",
};

export default function ConnectionCard({
  developer,
  mode = "connection",
  meta,
  onAccept,
  onReject,
  onRemove,
  onCancel,
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
          to={`/discover/developers/${developer.username}`}
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

        {mode === "outgoing" && (
          <Button variant="ghost" size="sm" leftIcon={X} onClick={onCancel}>
            Cancel
          </Button>
        )}

        {mode === "connection" && (
          <Button variant="ghost" size="sm" leftIcon={UserMinus} onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
    </Card>
  );
}
