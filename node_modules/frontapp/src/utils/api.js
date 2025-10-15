// src/utils/api.js
const BASE = import.meta.env.VITE_API_URL || "/api"

async function handle(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    const msg = text || `HTTP ${res.status}`
    throw new Error(msg)
  }
  // 204 No Content
  if (res.status === 204) return null
  const ct = res.headers.get("content-type") || ""
  return ct.includes("application/json") ? res.json() : res.text()
}

export const api = {
  get: (path) =>
    fetch(`${BASE}${path}`, { credentials: "include" }).then(handle),

  post: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body ?? {}),
    }).then(handle),

  put: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body ?? {}),
    }).then(handle),

  del: (path) =>
    fetch(`${BASE}${path}`, {
      method: "DELETE",
      credentials: "include",
    }).then(handle),
}
