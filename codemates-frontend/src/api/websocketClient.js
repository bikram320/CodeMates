import { Client } from "@stomp/stompjs";

/**
 * Singleton STOMP-over-WebSocket client, shared by every page that needs
 * live chat features (ProjectChat, Messages). One physical connection
 * for the whole app, not one per open conversation — multiple callers
 * subscribing to different destinations just multiplexes over it.
 *
 * Defaults to a native WebSocket connection (no SockJS), since the
 * backend docs only ever mention a plain "/ws" endpoint with no mention
 * of SockJS. If your Spring config actually registers the STOMP endpoint
 * with .withSockJS(), see the comment at the bottom of this file for the
 * exact swap (installing sockjs-client and changing the Client
 * construction) — nothing else in this file or its callers would need
 * to change.
 *
 * Auth: the WebSocket upgrade request is a normal browser HTTP request
 * first, so it carries the same httpOnly access_token cookie fetch()
 * calls do automatically (same-origin/allowed-origin). Nothing here
 * reads or sends a token manually — there's nothing for JS to read.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const WS_URL = API_BASE
  ? API_BASE.replace(/^http/, "ws") + "/ws"
  : `${window.location.origin.replace(/^http/, "ws")}/ws`;

let client = null;
let connectPromise = null;

function getClient() {
  if (client) return client;

  client = new Client({
    brokerURL: WS_URL,
    reconnectDelay: 4000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
  });

  return client;
}

/**
 * Connects if not already connected/connecting. Safe to call from many
 * places — every caller shares the same underlying connection and
 * in-flight connect attempt.
 * @returns {Promise<void>}
 */
export function connectSocket() {
  const c = getClient();
  if (c.connected) return Promise.resolve();
  if (connectPromise) return connectPromise;

  connectPromise = new Promise((resolve, reject) => {
    c.onConnect = () => resolve();
    c.onStompError = (frame) => reject(new Error(frame.headers?.message || "STOMP error"));
    c.onWebSocketError = (event) => reject(event);
    c.activate();
  }).finally(() => {
    connectPromise = null;
  });

  return connectPromise;
}

export function disconnectSocket() {
  if (client?.connected) client.deactivate();
}

/**
 * Subscribe to a STOMP destination. Returns an unsubscribe function.
 * Queues the subscription until the connection is actually open, so
 * it's safe to call before connectSocket() has resolved.
 *
 * @param {string} destination  e.g. "/topic/conversations/{id}"
 * @param {(payload: any) => void} onMessage  receives the JSON-parsed body
 * @returns {() => void} unsubscribe
 */
export function subscribe(destination, onMessage) {
  let stompSub = null;
  let cancelled = false;

  connectSocket().then(() => {
    if (cancelled) return;
    stompSub = getClient().subscribe(destination, (message) => {
      try {
        onMessage(JSON.parse(message.body));
      } catch {
        onMessage(message.body);
      }
    });
  });

  return () => {
    cancelled = true;
    stompSub?.unsubscribe();
  };
}

/**
 * Publish a frame. Transport-agnostic — callers pass the exact body
 * shape the backend expects (SendMessageRequest for /send, TypingEvent
 * for /typing).
 *
 * @param {string} destination  e.g. "/app/conversations/{id}/send"
 * @param {object} body
 */
export async function publish(destination, body) {
  await connectSocket();
  getClient().publish({ destination, body: JSON.stringify(body) });
}

/*
 * ── SockJS fallback ──────────────────────────────────────────────────
 * If the backend's STOMP endpoint actually uses .withSockJS(), install
 * sockjs-client (npm install sockjs-client) and replace the Client
 * construction in getClient() above with:
 *
 *   import SockJS from "sockjs-client";
 *   client = new Client({
 *     webSocketFactory: () => new SockJS(`${API_BASE}/ws`),
 *     reconnectDelay: 4000,
 *     heartbeatIncoming: 10000,
 *     heartbeatOutgoing: 10000,
 *   });
 *
 * SockJS uses http(s):// URLs (not ws(s)://) and does its own transport
 * negotiation, so `brokerURL` isn't used in that mode — everything else
 * in this file (subscribe, publish, connectSocket) stays the same.
 */