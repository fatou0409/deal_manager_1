// src/pages/AdminUsers.jsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { ROLES, ALL_ROLES } from "../auth/permissions";
import { api } from "../../lib/api";
import { useToast } from "../components/ToastProvider";

function genPwd() {
  return Math.random().toString(36).slice(2, 10) + "!";
}

export default function AdminUsers() {
  const { user, token, loading } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ email: "", role: ROLES.BD, password: genPwd() });
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Chargement initial depuis l'API backend
  useEffect(() => {
    if (!token) return;
    setLoadingUsers(true);
    api("/users", { token })
      .then(setUsers)
      .catch(() => toast.show("Erreur chargement utilisateurs", "error"))
      .finally(() => setLoadingUsers(false));
  }, [token]);

  const countByRole = useMemo(() => {
    const acc = { [ROLES.ADMIN]: 0, [ROLES.MANAGER]: 0, [ROLES.BD]: 0, [ROLES.GUEST]: 0 };
    for (const u of users) acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, [users]);

  function isLastAdmin(id) {
    const admins = users.filter((u) => u.role === ROLES.ADMIN);
    return admins.length === 1 && admins[0].id === id;
  }

  // Actions CRUD via API
  const addUser = async (e) => {
    e.preventDefault();
    const email = form.email.trim().toLowerCase();
    if (!email) return;
    if (!form.password || form.password.length < 6) {
      toast.show("Mot de passe trop court (min. 6).", "error");
      return;
    }
    if (users.some((u) => (u.email || "").toLowerCase() === email)) {
      toast.show("Cet email existe déjà.", "error");
      return;
    }
    try {
      // Les rôles sont déjà corrects (ADMIN, MANAGER, etc.)
      const newUser = await api("users", {
        method: "POST",
        token,
        body: { email, password: form.password, role: form.role },
      });
      setUsers((prev) => [newUser, ...prev]);
      toast.show(`Utilisateur créé: ${email}`, "success");
      setForm({ email: "", role: ROLES.BD, password: genPwd() });
    } catch (err) {
      toast.show(err.message || "Erreur création utilisateur", "error");
    }
  };

  const changeRole = async (id, role) => {
    if (!ALL_ROLES.includes(role)) return;
    if (isLastAdmin(id) && role !== ROLES.ADMIN) {
      toast.show("Impossible de retirer le dernier Administrateur.", "error");
      return;
    }
    try {
      const updated = await api(`/users/${id}`, {
        method: "PATCH",
        token,
        body: { role },
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
      toast.show("Rôle mis à jour", "success");
    } catch (err) {
      toast.show(err.message || "Erreur changement de rôle", "error");
    }
  };

  const removeUser = async (id) => {
    if (isLastAdmin(id)) {
      toast.show("Impossible de supprimer le dernier Administrateur.", "error");
      return;
    }
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    try {
      await api(`/users/${id}`, { method: "DELETE", token });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.show("Utilisateur supprimé", "success");
    } catch (err) {
      toast.show(err.message || "Erreur suppression utilisateur", "error");
    }
  };

  const resetPassword = async (id) => {
    const pwd = genPwd();
    try {
      // Ici, il faudrait une route API dédiée pour reset le mot de passe
      // Pour l'instant, on fait un PATCH
      const updated = await api(`/users/${id}`, {
        method: "PATCH",
        token,
        body: { password: pwd },
      });
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updated } : u)));
      toast.success(`Nouveau mot de passe pour ${updated.email} : ${pwd}`);
    } catch (err) {
      toast.error(err.message || "Erreur réinit. mot de passe");
    }
  };

  const copyAccess = async (u) => {
    const msg = `Accès Deal Manager\nEmail: ${u.email}\nURL: ${location.origin}/login`;
    try {
      await navigator.clipboard.writeText(msg);
      toast.success("Accès copié dans le presse-papiers.");
    } catch {
      alert(msg);
    }
  };

  // 👉 Bouton "Créer BD & Invité"
  // Désactiver les boutons de seed demo côté backend
  // ...existing code...

  // Filtre
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) => u.email.toLowerCase().includes(s) || (u.role || "").toLowerCase().includes(s)
    );
  }, [users, q]);

  // Guards
  if (loading || loadingUsers) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-black/70">
        <div className="animate-pulse rounded-xl border border-black/10 bg-white px-4 py-3">Chargement…</div>
      </div>
    );
  }

  if (!user || user.role !== ROLES.ADMIN) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-gradient-to-b from-orange-50 to-white">
        <div className="rounded-3xl border border-black/10 bg-white px-6 py-8 shadow-sm text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-orange-600 text-white grid place-items-center text-xl font-bold">403</div>
          <h1 className="text-lg font-semibold">Accès Administrateur requis</h1>
          <p className="text-sm text-black/60">Tu n’as pas les droits pour cette page.</p>
        </div>
      </div>
    );
  }

  // UI
  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
        />
        <div className="relative p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Administration — Utilisateurs</h2>
          <p className="mt-1 text-white/80 text-sm">
            Créer, changer de rôle, ré-initialiser les mots de passe, et partager des accès.
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: "Administrateurs", value: countByRole[ROLES.ADMIN] || 0 },
              { label: "Managers", value: countByRole[ROLES.MANAGER] || 0 },
              { label: "Business Dev", value: countByRole[ROLES.BD] || 0 },
              { label: "Invités", value: countByRole[ROLES.GUEST] || 0 },
            ].map((k) => (
              <div key={k.label} className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-3">
                <div className="text-xs text-white/80">{k.label}</div>
                <div className="text-2xl font-semibold">{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barre d'action */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Formulaire ajout */}
        <form onSubmit={addUser} className="flex-1 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="font-semibold text-black mb-3">Ajouter un utilisateur</div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="email"
              required
              placeholder="email@exemple.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
            />
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <input
              type="text"
              required
              placeholder="Mot de passe temporaire"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
            />
            <button className="rounded-xl bg-orange-600 text-white px-3 py-2 border border-orange-600 hover:bg-orange-500">
              Créer
            </button>
          </div>
        </form>

        {/* Recherche */}
        <div className="md:w-72 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="font-semibold text-black mb-3">Recherche</div>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="email, rôle…"
            className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
          />
        </div>

          {/* ...existing code... */}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-black/70">
              <th className="py-2">Email</th>
              <th className="py-2">Rôle</th>
              <th className="py-2">Obligation MDP</th>
              <th className="py-2">Créé le</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-black/50">Aucun utilisateur</td>
              </tr>
            ) : (
              filtered.map((u) => (
                <tr key={u.id} className="border-t border-black/5">
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="rounded-lg border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-orange-600"
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2">{u.mustChangePassword ? "Oui" : "Non"}</td>
                  <td className="py-2">{new Date(u.createdAt || Date.now()).toLocaleString()}</td>
                  <td className="py-2">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => copyAccess(u)}
                        className="px-2 py-1 rounded-lg border border-black/10 hover:bg-orange-50"
                      >
                        Copier accès
                      </button>
                      <button
                        onClick={() => resetPassword(u.id)}
                        className="px-2 py-1 rounded-lg border border-black/10 hover:bg-orange-50"
                      >
                        Réinit. MDP
                      </button>
                      <button
                        onClick={() => removeUser(u.id)}
                        className="px-2 py-1 rounded-lg border border-black/10 hover:bg-orange-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
