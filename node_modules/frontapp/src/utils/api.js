const API_URL = import.meta.env.VITE_API_URL || "/api";

export async function api(path, options = {}) {
  const { method = "GET", token, body } = options;
  
  // 🔑 Récupérer le token depuis localStorage si non fourni
  const authToken = token || localStorage.getItem('token');
  
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const url = `${API_URL}${path.startsWith('/') ? path : '/' + path}`;
  
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data = null;
  const contentType = res.headers.get("content-type");
  
  if (contentType?.includes("application/json")) {
    try {
      data = await res.json();
    } catch (e) {
      console.error('Erreur parsing JSON:', e);
    }
  }

  // Si 401 et token expiré, nettoyer et rediriger
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error(data?.message || 'Non autorisé');
  }

  if (!res.ok) {
    throw new Error(data?.message || `Erreur HTTP ${res.status}`);
  }

  return data;
}
