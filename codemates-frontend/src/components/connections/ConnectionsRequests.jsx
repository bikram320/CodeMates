import { Inbox } from "lucide-react";
import ConnectionCard from "./ConnectionCard";
import EmptyState from "../ui/EmptyState";

function formatShortDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

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
        <div className="flex flex-col gap-4">
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