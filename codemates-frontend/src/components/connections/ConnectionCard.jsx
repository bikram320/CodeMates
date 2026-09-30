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
<<<<<<< Updated upstream
          )}
=======
          </div>

          <Button
            to={`/connections/developers/${developer.username}`}
            variant="secondary"
            size="sm"
            className="shrink-0 gap-1.5 !bg-[#6366F1] text-white"
          >
            View Profile <ArrowRight size={14} />
          </Button>
>>>>>>> Stashed changes
        </div>
        {MODE_LABEL[mode] && (
          <Badge variant="outline" className="shrink-0">
            {MODE_LABEL[mode]}
          </Badge>
        )}
      </div>

<<<<<<< Updated upstream
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
=======
        {(developer.experienceLevel || developer.isOpenToCollaborate !== undefined) && (
            <div className="flex items-center gap-2">
              {developer.experienceLevel && (
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--cm-text-dim)]">
              {developer.experienceLevel}
            </span>
              )}
              {developer.isOpenToCollaborate !== undefined && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      developer.isOpenToCollaborate
                        ? "bg-[#10B981]/10 text-[#10B981]"
                        : "bg-[#F59E0B]/10 text-[#F59E0B]"
                    }`}
                  >
                    {statusLabel}
                  </span>
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

        {(meta || MODE_LABEL[mode]) && (
          <div className="flex flex-wrap items-center gap-2">
            {MODE_LABEL[mode] && (
              <Badge variant="outline" className="text-[10px]">
                {MODE_LABEL[mode]}
              </Badge>
            )}
            {meta && <p className="text-xs text-[var(--cm-muted)]">{meta}</p>}
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-start gap-2">
    

            <div className="mt-1 flex flex-wrap items-center gap-2">
              {mode === "incoming" && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={Check}
                    onClick={onAccept}
                    className="!bg-[#008000] text-white"
                  >
                    Accept
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={X}
                    onClick={onReject}
                    className="!bg-[#A60000] text-white"
                  >
                    Reject
                  </Button>
                </>
              )}

              {mode === "connection" && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={UserMinus}
                  onClick={onRemove}
                  className="!bg-[#C68000] text-white"
                >
                  Remove
                </Button>
              )}

              {onBlock && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={Ban}
                  onClick={onBlock}
                  className="!bg-[#A60000] text-white"
                >
                  Block
                </Button>
              )}
            </div>
          </div>
      </Card>
>>>>>>> Stashed changes
  );
}