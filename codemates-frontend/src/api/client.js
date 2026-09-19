/**
 * src/api/client.js
 *
 * Thin fetch wrapper for the CodeMates Spring Boot gateway.
 *
 * Key details from the API docs:
 * - Base URL: http://localhost:8080  (all calls go through the gateway)
 * - Auth:     httpOnly cookies — every request must include credentials: 'include'
 *             Do NOT read tokens from JS or set Authorization headers.
 * - Envelope: Every response is { success, message, data, timestamp }
 *             This client automatically unwraps and returns response.data.
 * - Errors:   Non-2xx responses throw an Error with .status and .message set
 *             to the API's human-readable message string.
 *
 * Config via .env:
 *   VITE_API_BASE_URL=http://localhost:8080
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * Core request function.
 * Unwraps the { success, message, data } envelope automatically.
 *
 * @param {string}      endpoint - e.g. '/api/users/me'
 * @param {RequestInit} options  - standard fetch options (method, body, etc.)
 * @returns {Promise<any>} The `data` field from the API envelope
 */
async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;

  const config = {
    // Required for httpOnly cookie auth — never remove this
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  // Handle 204 No Content (delete operations, mark-read, etc.)
  if (response.status === 204) return null;

  const envelope = await response.json();

  // The API always returns { success, message, data, timestamp }
  // Gateway-level 401s use the same shape minus `timestamp`
  if (!response.ok) {
    const error = new Error(envelope?.message || `Request failed: ${response.status}`);
    error.status = response.status;
    error.body = envelope;
    throw error;
  }

  // Return just the payload — callers don't need to unwrap the envelope
  return envelope.data;
}

/**
 * HTTP method shortcuts.
 *
 * Usage:
 *   const profile = await client.get('/api/users/me')
 *   const project = await client.post('/api/projects', { name: 'My App' })
 */
const client = {
  get: (endpoint, options = {}) =>
    request(endpoint, { method: 'GET', ...options }),

  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),

  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    }),

  patch: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    }),

  delete: (endpoint, options = {}) =>
    request(endpoint, { method: 'DELETE', ...options }),
};

export default client;