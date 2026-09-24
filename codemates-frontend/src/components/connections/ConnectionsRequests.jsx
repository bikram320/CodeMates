import { Inbox } from "lucide-react";
import ConnectionCard from "./ConnectionCard";
import EmptyState from "../ui/EmptyState";

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Incoming connection requests.
 *
 * There used to be an "Outgoing Requests" section here too. It's gone —
 * not hidden, not empty-by-default, actually removed — because the real
 * social-service API has no endpoint that can ever return "requests I
 * sent that are still pending" (GET /pending is hard-coded to the
 * receiver side; see connectionsApi.js). Leaving an always-empty section
 * in the UI would misleadingly suggest the feature exists and just
 * hasn't found any data yet.
 *
 * Props:
 * - incoming  enriched request objects: { id, developer, createdAt }
 * - onAccept, onReject   (request) => void
 * - onBlock              optional (request) => void
 */
export default function ConnectionRequests({ incoming = [], onAccept, onReject, onBlock }) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold text-[var(--cm-text)]">
        Incoming Requests{incoming.length > 0 && ` (${incoming.length})`}
      </h2>
      {incoming.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="No incoming requests"
          description="New connection requests will show up here."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {incoming.map((request) => (
            <ConnectionCard
              key={request.id}
              developer={request.developer}
              mode="incoming"
              meta={`Requested ${formatShortDate(request.createdAt)}`}
              onAccept={() => onAccept(request)}
              onReject={() => onReject(request)}
              onBlock={onBlock ? () => onBlock(request) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}