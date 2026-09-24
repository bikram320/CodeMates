/**
 * src/api/notificationsApi.js
 *
 * The single notifications network layer, calling the real Spring Boot
 * NotificationController directly (no mock). useNotifications() is the only
 * caller; there is no per-page API file.
 *
 * Matches NotificationController exactly:
 *   GET    /api/notifications              ?before=&limit=&unreadOnly=
 *                                           → ApiResponse<NotificationPageResponse>
 *                                           { notifications, nextCursor, hasMore }
 *   GET    /api/notifications/unread-count → ApiResponse<UnreadCountResponse> { unreadCount }
 *   PATCH  /api/notifications/{id}/read    → ApiResponse<NotificationResponse> (the updated one)
 *   PATCH  /api/notifications/read-all     → ApiResponse<Map<String,Integer>> { updatedCount }
 *   DELETE /api/notifications/{id}         → ApiResponse<Void>
 *
 * `before`/`limit`/`unreadOnly` are the only filters the backend accepts —
 * there's no `type` filter, so the "type" chips in the UI still filter
 * client-side over whatever page(s) are loaded (see useNotifications.js).
 *
 * NotificationResponse has no recipientUserId (the list is already scoped to
 * whoever the request's cookie identifies) and no sender name/avatar — only
 * senderUserId — title/body are plain server-built strings.
 *
 * Auth: NotificationController reads the caller's userId out of the request via
 * JwtCookieExtractor (the same access_token httpOnly cookie auth-service sets),
 * not a request parameter. Every call below sends credentials: 'include' so
 * the browser attaches that cookie; without it every request is unauthenticated.
 *
 * VITE_API_BASE_URL works the same way as in authApi.js. If notification-service
 * is reachable at a different origin/port than auth-service (rather than both
 * sitting behind one gateway/origin), a second env var would be needed here —
 * ask if that's the case.
 *
 * Error shape: same ApiResponse<T> envelope as auth-service
 * ({ success, message, data }), so the same unwrap-and-throw approach applies.
 * There's no per-field validation on any of these endpoints (no user input
 * beyond an id in the URL), so there's no field-guessing here the way
 * authApi.js has for register/reset-password.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const apiError = (message, status) => Object.assign(new Error(message), { status });

/**
 * @param {string} path e.g. '/api/notifications'
 * @param {{ method?: string, params?: object, raw?: boolean }} [opts]
 *   `params` are appended as a query string (falsy values omitted).
 *   `raw: true` resolves with the full envelope instead of just `data`.
 */
async function request(path, { method = 'GET', params, raw = false } = {}) {
  const url = new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    });
  }

  let res;
  try {
    res = await fetch(url, { method, credentials: 'include' });
  } catch {
    throw apiError("Couldn't reach CodeMates. Check your connection and try again.", 0);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* no/invalid body, e.g. some network-layer error pages */
  }

  if (!res.ok || json?.success === false) {
    throw apiError(json?.message || `Request failed (${res.status}).`, res.status);
  }
  return raw ? json : json?.data ?? null;
}

/**
 * @param {{ before?: string, limit?: number, unreadOnly?: boolean }} [params]
 *   `before` is a cursor: pass the previous page's `nextCursor` to get the next
 *   page. The backend clamps `limit` to 1–100 regardless of what's sent.
 * @returns {Promise<{ notifications: object[], nextCursor: string|null, hasMore: boolean }>}
 */
export function getNotifications({ before, limit = 20, unreadOnly = false } = {}) {
  return request('/api/notifications', { params: { before, limit, unreadOnly } });
}

/** @returns {Promise<{ unreadCount: number }>} */
export function getUnreadCount() {
  return request('/api/notifications/unread-count');
}

/** @returns {Promise<object>} the updated notification */
export function markNotificationAsRead(notificationId) {
  return request(`/api/notifications/${notificationId}/read`, { method: 'PATCH' });
}

/** @returns {Promise<{ updatedCount: number }>} */
export function markAllNotificationsAsRead() {
  return request('/api/notifications/read-all', { method: 'PATCH' });
}

/** @returns {Promise<null>} */
export function deleteNotification(notificationId) {
  return request(`/api/notifications/${notificationId}`, { method: 'DELETE' });
}