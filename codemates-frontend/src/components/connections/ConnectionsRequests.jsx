import { Inbox, Send } from "lucide-react";
import ConnectionCard from "./ConnectionCard";
import EmptyState from "../ui/EmptyState";

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Incoming and outgoing connection requests, as two separate sections
 * each with their own empty state.
 *
 * Props:
 * - incoming  enriched request objects: { id, developer, createdAt }
 * - outgoing  same shape
 * - onAccept, onReject   (request) => void — incoming only
 * - onCancel             (request) => void — outgoing only
 */
export default function ConnectionRequests({
  incoming = [],
  outgoing = [],
  onAccept,
  onReject,
  onCancel,
}) {
  return (
    <div className="flex flex-col gap-8">
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
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--cm-text)]">
          Outgoing Requests{outgoing.length > 0 && ` (${outgoing.length})`}
        </h2>
        {outgoing.length === 0 ? (
          <EmptyState
            icon={Send}
            title="No outgoing requests"
            description="Requests you send will appear here until they're accepted."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {outgoing.map((request) => (
              <ConnectionCard
                key={request.id}
                developer={request.developer}
                mode="outgoing"
                meta={`Sent ${formatShortDate(request.createdAt)}`}
                onCancel={() => onCancel(request)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}