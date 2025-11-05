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
  // Si le token a expiré, nettoyer la session côté client pour éviter d'avoir
  // des états incohérents (token dans localStorage mais 401 côté API).
  if (res.status === 401 && data && (data.message === 'Token expired' || data.message === 'Invalid token' || data.message === 'Missing token')) {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    } catch (e) {
      // ignore
    }
    // Forcer reload pour que l'app retourne sur la page de login proprement
    // (le provider React réagira à l'absence de token dans localStorage)
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    throw new Error(data?.message || `HTTP ${res.status}`);
  }

  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}
