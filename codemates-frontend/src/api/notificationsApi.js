/**
 * src/api/notificationsApi.js
 *
 * The only module that knows where notification data comes from.
 * Currently routed to the in-memory mock (src/mock/notificationsMock.js).
 *
 * ── Going live later ──────────────────────────────────────────────────────────
 *   Replace each body below with a call through src/api/client.js and delete
 *   the mock import. Signatures and return shapes must stay the same so
 *   useNotifications() and the UI don't change. Endpoints (api docs §8):
 *
 *     getNotifications              GET    /api/notifications?before=&limit=&unreadOnly=
 *     markNotificationAsRead        PATCH  /api/notifications/{id}/read
 *     markAllNotificationsAsRead    PATCH  /api/notifications/read-all
 *     deleteNotification            DELETE /api/notifications/{id}
 *
 *   Return the unwrapped `data` payload (not the { success, message, data,
 *   timestamp } envelope), as the mock does.
 */

import {
  mockDeleteNotification,
  mockGetNotifications,
  mockMarkAllNotificationsAsRead,
  mockMarkNotificationAsRead,
} from "../mock/notificationsMock";

/**
 * @param {{ before?: string, limit?: number, unreadOnly?: boolean }} [params]
 * @returns {Promise<{ notifications: object[], nextCursor: string|null, hasMore: boolean }>}
 */
export const getNotifications = (params) => mockGetNotifications(params);

/** @returns {Promise<object>} the updated NotificationResponse */
export const markNotificationAsRead = (notificationId) => mockMarkNotificationAsRead(notificationId);

/** @returns {Promise<{ updatedCount: number }>} */
export const markAllNotificationsAsRead = () => mockMarkAllNotificationsAsRead();

/** @returns {Promise<null>} */
export const deleteNotification = (notificationId) => mockDeleteNotification(notificationId);