// src/lib/api.js
// ✅ Fichier API centralisé - À utiliser partout dans l'application

const API_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Fonction API centralisée pour toutes les requêtes HTTP
 * @param {string} path - Le chemin de l'endpoint (ex: "/deals", "/users")
 * @param {object} options - Options de la requête
 * @param {string} options.method - Méthode HTTP (GET, POST, PUT, DELETE, PATCH)
 * @param {string} options.token - Token JWT d'authentification
 * @param {object} options.body - Corps de la requête (sera converti en JSON)
 * @returns {Promise} - Promise contenant les données de la réponse
 */
export async function api(path, { method = "GET", token, body } = {}) {
  const headers = {};
  
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Assure qu'il n'y a qu'un seul slash entre API_URL et path
  const url = `${API_URL}${path.startsWith('/') ? path : '/' + path}`;

  const res = await fetch(url, {
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
    console.warn("Impossible de parser la réponse JSON", e);
  }

  // Gestion des erreurs HTTP
  if (!res.ok) {
    const msg = data?.message || `Erreur HTTP ${res.status} (${res.statusText})`;
    throw new Error(msg);
  }

  return data;
}

// Export d'helpers pour simplifier les appels
export const apiHelpers = {
  get: (path, token) => api(path, { method: "GET", token }),
  post: (path, body, token) => api(path, { method: "POST", body, token }),
  put: (path, body, token) => api(path, { method: "PUT", body, token }),
  patch: (path, body, token) => api(path, { method: "PATCH", body, token }),
  del: (path, token) => api(path, { method: "DELETE", token }),
};