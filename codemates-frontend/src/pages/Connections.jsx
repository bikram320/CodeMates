import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import ConnectionsHeader from "../components/connections/ConnectionsHeader";
import ConnectionFilters from "../components/connections/ConnectionFilters";
import ConnectionRequests from "../components/connections/ConnectionsRequests";
import ConnectionList from "../components/connections/ConnectionList";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

import { useConnections } from "../hooks/useConnections";
import { useUserProfiles } from "../hooks/useUserProfiles";
import { developerFromProfile } from "../utils/developerProfileMapping";

/**
 * Connections page (/connections).
 *
 * Fully connected to the real backend — no mock data. Names/avatars come
 * from a real profile lookup (useUserProfiles -> GET /api/users/by-ids),
 * resolving the otherUserId/senderUserId that connectionsApi.js returns.
 * See ProfileController/ProfileService for that endpoint.
 *
 * There's no "Outgoing Requests" section — see ConnectionRequests.jsx and
 * connectionsApi.js for why that's permanently unavailable.
 */
export default function Connections() {
  const [search, setSearch] = useState("");

  const {
    connections,
    incomingRequests,
    isLoading,
    isError,
    error,
    acceptConnectionRequest,
    rejectConnectionRequest,
    blockConnection,
    removeConnection,
  } = useConnections();

  const idsToResolve = [
    ...connections.map((c) => c.otherUserId),
    ...incomingRequests.map((r) => r.senderUserId),
  ];

  const { profileMap, isLoading: profilesLoading } = useUserProfiles(idsToResolve);

  if (isLoading || profilesLoading) {
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

  const enrichedConnections = connections.map((c) => ({
    ...c,
    developer: developerFromProfile(c.otherUserId, profileMap.get(c.otherUserId)),
  }));

  const enrichedIncoming = incomingRequests.map((r) => ({
    ...r,
    developer: developerFromProfile(r.senderUserId, profileMap.get(r.senderUserId)),
  }));

  const filteredConnections = enrichedConnections.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return (
        c.developer.name.toLowerCase().includes(term) ||
        c.developer.username.toLowerCase().includes(term)
    );
  });

  return (
      <div className="connections-page flex flex-col gap-8">
        <ConnectionsHeader
            totalConnections={connections.length}
            pendingCount={incomingRequests.length}
        />

        <ConnectionRequests
            incoming={enrichedIncoming}
            onAccept={(request) => acceptConnectionRequest(request.id)}
            onReject={(request) => rejectConnectionRequest(request.id)}
            onBlock={(request) => blockConnection(request.id)}
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
              onBlock={(connection) => blockConnection(connection.connectionId)}
          />
        </div>
      </div>
  );
}