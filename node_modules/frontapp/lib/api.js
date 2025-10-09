// src/lib/api.js
const API_URL = "/api"; // On utilise le proxy de Vite

export async function api(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path.startsWith('/') ? '' : '/'}${path}`, { // Assure un seul slash
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Tente de parser le JSON même en cas d'erreur
  let data = null;
  const contentType = res.headers.get("content-type");
  try {
    if (contentType?.includes("application/json")) {
      data = await res.json();
    }
  } catch (e) {
    console.warn("Could not parse JSON response body", e);
  }

  if (!res.ok) {
    const msg = data?.message || `Erreur HTTP ${res.status} (${res.statusText})`;
    throw new Error(msg);
  }
  return data;
}
