// Utiliser `/api` par défaut pour rester compatible avec le backend (proxy ou préfixe)
const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function api(path, { method = "GET", token, body } = {}) {
  const headers = {};

  // Si un body est fourni, ajouter Content-Type
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // Si aucun token n'a été fourni explicitement, essayer le localStorage/sessionStorage
  if (!token) {
    try {
      token = localStorage.getItem('token') || sessionStorage.getItem('token') || undefined;
    } catch (e) {
      // Dans certains environnements (SSR/test) l'accès à localStorage peut échouer
      token = undefined;
    }
  }

  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path.startsWith('/') ? path : '/' + path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  try {
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      data = await res.text();
    }
  } catch (e) {
    console.error('Erreur lors du parsing JSON', e);
  }

  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}
