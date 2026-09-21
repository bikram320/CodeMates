import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import ConnectionsHeader from "../components/connections/ConnectionsHeader";
import ConnectionFilters from "../components/connections/ConnectionFilters";
import ConnectionRequests from "../components/connections/ConnectionsRequests";
import ConnectionList from "../components/connections/ConnectionList";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

import { findDeveloper } from "../mock/connectionsMock";
import { useConnections } from "../hooks/useConnections";

/**
 * Connections page (/connections).
 *
 * Data flow: this page -> useConnections() -> connectionsApi.js ->
 * connectionsMock.js (see those two files for exactly where
 * getOutgoingRequests and removeConnection diverge from the real
 * connection-service API).
 *
 * findDeveloper is still imported directly from the mock (not through
 * the hook) — resolving a userId into a displayable developer is
 * presentation logic, not data-fetching, same pattern used everywhere
 * else in this app (tasks, resources, contributions, chat).
 */
export default function Connections() {
  const [search, setSearch] = useState("");

  const {
    connections,
    incomingRequests,
    outgoingRequests,
    isLoading,
    isError,
    error,
    acceptConnectionRequest,
    rejectConnectionRequest,
    removeConnection,
  } = useConnections();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="Couldn't load connections"
        description={error?.message || "Please try again."}
      />
    );
  }

  const enrichedConnections = connections
    .map((c) => ({ ...c, developer: findDeveloper(c.otherUserId) }))
    .filter((c) => c.developer);

  const enrichedIncoming = incomingRequests
    .map((r) => ({ ...r, developer: findDeveloper(r.senderUserId) }))
    .filter((r) => r.developer);

  const enrichedOutgoing = outgoingRequests
    .map((r) => ({ ...r, developer: findDeveloper(r.receiverUserId) }))
    .filter((r) => r.developer);

  const filteredConnections = enrichedConnections.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
      c.developer.name.toLowerCase().includes(term) ||
      c.developer.username.toLowerCase().includes(term) ||
      c.developer.skills.some((skill) => skill.toLowerCase().includes(term))
    );
  });

  return (
    <div className="connections-page flex flex-col gap-8">
      <ConnectionsHeader
        totalConnections={connections.length}
        pendingCount={incomingRequests.length + outgoingRequests.length}
      />

      <ConnectionRequests
        incoming={enrichedIncoming}
        outgoing={enrichedOutgoing}
        onAccept={(request) => acceptConnectionRequest(request.id)}
        onReject={(request) => rejectConnectionRequest(request.id)}
        onCancel={(request) => removeConnection(request.id)}
      />

      <div>
        <h2 className="mb-4 text-sm font-semibold text-[var(--cm-text)]">
          Your Connections
        </h2>
        <div className="mb-4">
          <ConnectionFilters search={search} onSearchChange={setSearch} />
        </div>
        <ConnectionList
          connections={filteredConnections}
          onRemove={(connection) => removeConnection(connection.connectionId)}
        />
      </div>
    </div>
  );
}
