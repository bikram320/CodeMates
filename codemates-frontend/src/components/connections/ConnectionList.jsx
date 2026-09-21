import { Users } from "lucide-react";
import ConnectionCard from "./ConnectionCard";
import EmptyState from "../ui/EmptyState";

function formatConnectedSince(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    year: "numeric",
  });
}

/**
 * Grid of accepted connections.
 *
 * Props:
 * - connections  enriched connection objects: { connectionId, developer, connectedSince }
 * - onRemove     (connection) => void
 */
export default function ConnectionList({ connections = [], onRemove }) {
  if (connections.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No connections yet"
        description="Connect with developers from Discover to start building your network."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {connections.map((connection) => (
        <ConnectionCard
          key={connection.connectionId}
          developer={connection.developer}
          mode="connection"
          meta={`Connected since ${formatConnectedSince(connection.connectedSince)}`}
          onRemove={() => onRemove(connection)}
        />
      ))}
    </div>
  );
}