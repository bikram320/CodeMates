import { useState } from "react";
import { AlertTriangle } from "lucide-react";

import ConnectionsHeader from "../components/connections/ConnectionsHeader";
import ConnectionFilters from "../components/connections/ConnectionFilters";
import ConnectionRequests from "../components/connections/ConnectionsRequests";
import ConnectionList from "../components/connections/ConnectionList";
import Spinner from "../components/ui/Spinner";
import EmptyState from "../components/ui/EmptyState";

import { useConnections } from "../hooks/useConnections";
import useUserDirectory from "../hooks/useUserDirectory";

// Builds the card's "developer" from a resolved profile. ConnectionSummaryDto /
// ConnectionResponseDto only carry raw userIds, so names/avatars/skills come
// from useUserDirectory. Name fallback: fullName → username → "User 1234abcd".
function toDeveloper(userId, profile) {
  const short = userId?.slice(0, 8) ?? "unknown";
  return {
    id: userId,
    name: profile?.fullName?.trim() || profile?.username || `User ${short}`,
    username: profile?.username ?? short,
    avatarUrl: profile?.avatarUrl || undefined,
    role: profile?.headline || profile?.title || undefined,
    skills: (profile?.skills ?? [])
        .map((skill) => (typeof skill === "string" ? skill : skill?.name))
        .filter(Boolean),
  };
}

/**
 * Connections page (/connections).
 *
 * Fully connected to the real backend — no mock data. There's no
 * "Outgoing Requests" section anymore; see ConnectionRequests.jsx and
 * connectionsApi.js for why that's permanently unavailable rather than
 * just not-yet-built.
 *
 * No useAuth() needed here, unlike chat — ConnectionSummaryDto already
 * resolves "who's the other person" server-side (otherUserId), and
 * ConnectionResponseDto for a pending request is always one where the
 * current user is the receiver, so senderUserId is always "the other
 * person" too. Nothing here depends on knowing your own id.
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

  // Resolve every userId on the page in one batched call. Must run before the
  // early returns below so hook order stays stable.
  const { directory } = useUserDirectory([
    ...connections.map((c) => c.otherUserId),
    ...incomingRequests.map((r) => r.senderUserId),
  ]);

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

  const enrichedConnections = connections.map((c) => ({
    ...c,
    developer: toDeveloper(c.otherUserId, directory[c.otherUserId]),
  }));

  const enrichedIncoming = incomingRequests.map((r) => ({
    ...r,
    developer: toDeveloper(r.senderUserId, directory[r.senderUserId]),
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