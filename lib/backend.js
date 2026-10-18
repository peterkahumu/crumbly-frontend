export const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:8000";

export async function backendFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${BACKEND_URL}${path}`;
  const headers = { ...(options.headers || {}) };
  if (!headers["Content-Type"] && !headers["content-type"] && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const message = errorBody.detail || errorBody.error || errorBody.message || `Request failed (${res.status})`;
    const err = new Error(typeof message === "string" ? message : JSON.stringify(message));
    err.status = res.status;
    err.body = errorBody;
    throw err;
  }

  // Handle empty or attachment responses
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}
