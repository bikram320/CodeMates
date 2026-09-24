/**
 * Shared HTTP client for every REST call to the API Gateway.
 *
 * Envelope shape confirmed directly from contribution-service's actual
 * ApiResponse.java: { success, message, data } — no `timestamp` field.
 * Every function below unwraps this automatically, so feature API
 * modules (contributionsApi.js, etc.) just get the payload.
 *
 * Auth is httpOnly-cookie based (access_token/refresh_token) — every
 * request sends credentials: "include"; nothing here touches
 * localStorage for tokens, and nothing should.
 *
 * Base URL comes from VITE_API_BASE_URL (e.g. http://localhost:8080 for
 * the local Gateway). Set it in your .env file — never hardcode a host
 * in a feature API module.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(message, { status, data } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(path, { method = "GET", body, params, signal } = {}) {
  const url = new URL(path, BASE_URL || window.location.origin);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      url.searchParams.set(key, Array.isArray(value) ? value.join(",") : value);
    });
  }

  let response;
  try {
    response = await fetch(url.toString(), {
      method,
      credentials: "include",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError("Network error — could not reach the API Gateway", {
      status: 0,
      data: null,
    });
  }

  // Some endpoints (DELETE, etc.) may return an empty body.
  const text = await response.text();
  let envelope = null;
  if (text) {
    try {
      envelope = JSON.parse(text);
    } catch {
      envelope = null;
    }
  }

  if (response.status === 401) {
    // TODO once login/session restore exists: attempt a silent
    // POST /api/auth/refresh here and retry once before giving up.
    throw new ApiError(envelope?.message || "Not authenticated", {
      status: 401,
      data: null,
    });
  }

  if (!response.ok || envelope?.success === false) {
    throw new ApiError(envelope?.message || `Request failed (${response.status})`, {
      status: response.status,
      data: envelope?.data ?? null,
    });
  }

  return envelope && "data" in envelope ? envelope.data : envelope;
}

export const apiClient = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) => request(path, { ...options, method: "POST", body }),
  put: (path, body, options) => request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) => request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
};

export default apiClient;