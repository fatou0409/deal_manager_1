// src/utils/api.js
const BASE = import.meta.env.VITE_API_URL || "http://localhost:4001/api"

// 🔑 Fonction pour récupérer le token
function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// 🔑 Fonction pour créer les headers avec le token
function getHeaders(includeToken = true) {
  const headers = {
    "Content-Type": "application/json",
  };
  
  if (includeToken) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  
  return headers;
}

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
    fetch(`${BASE}${path}`, { 
      credentials: "include",
      headers: getHeaders() // 🔑 Ajouter le token
    }).then(handle),

  post: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: "POST",
      headers: getHeaders(), // 🔑 Ajouter le token
      credentials: "include",
      body: JSON.stringify(body ?? {}),
    }).then(handle),

  put: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: "PUT",
      headers: getHeaders(), // 🔑 Ajouter le token
      credentials: "include",
      body: JSON.stringify(body ?? {}),
    }).then(handle),

  del: (path) =>
    fetch(`${BASE}${path}`, {
      method: "DELETE",
      credentials: "include",
      headers: getHeaders(), // 🔑 Ajouter le token
    }).then(handle),
}