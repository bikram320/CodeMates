import { useEffect, useState } from "react";
import { subscribe } from "../api/websocketClient";

/**
 * Global online/offline presence map: { [userId]: "ONLINE" | "OFFLINE" }.
 * Subscribes to /topic/presence (PresenceBroadcast). Safe to call from
 * multiple components at once — the underlying WebSocket connection is a
 * shared singleton (see websocketClient.js), so this just adds another
 * listener on the same stream, not another connection.
 */
export function usePresence() {
  const [presence, setPresence] = useState({});

  useEffect(() => {
    return subscribe("/topic/presence", (broadcast) => {
      setPresence((prev) => ({ ...prev, [broadcast.userId]: broadcast.status }));
    });
  }, []);

  return presence;
}