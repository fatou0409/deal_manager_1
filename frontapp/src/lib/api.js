const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4001";

export async function api(path, { method = "GET", token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    console.error('Erreur lors du parsing JSON', e);
    throw new Error(`Erreur réseau ou réponse invalide (${res.status})`);
  }
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}
