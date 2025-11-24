// src/pages/AdminUsers.jsx - VERSION CORRIGÉE : Badge rôle + Modal édition
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { api } from "../utils/api";
import { useToast } from "../components/ToastProvider";

const ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  BUSINESS_DEVELOPER: 'BUSINESS_DEVELOPER',
  GUEST: 'GUEST'
};

const ALL_ROLES = Object.values(ROLES);

// ✅ Configuration des badges de rôles
const ROLE_BADGES = {
  ADMIN: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', label: 'Admin' },
  MANAGER: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', label: 'Manager' },
  BUSINESS_DEVELOPER: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', label: 'Business Dev' },
  GUEST: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', label: 'Invité' }
};

function genPwd() {
  return Math.random().toString(36).slice(2, 10) + "!";
}

export default function AdminUsers() {
  const { user, loading } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [form, setForm] = useState({ 
    email: "", 
    role: ROLES.BUSINESS_DEVELOPER,
    password: genPwd() 
  });
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  // ✅ États pour le modal d'édition
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", role: "", isActive: true });

  useEffect(() => {
    setLoadingUsers(true);
    api('/users')
      .then(data => {
        console.log('Utilisateurs chargés:', data);
        setUsers(data);
      })
      .catch(err => {
        console.error('Erreur chargement:', err);
        toast.show("Erreur chargement utilisateurs", "error");
      })
      .finally(() => setLoadingUsers(false));
  }, []);

  const countByRole = useMemo(() => {
    const acc = { 
      [ROLES.ADMIN]: 0, 
      [ROLES.MANAGER]: 0, 
      [ROLES.BUSINESS_DEVELOPER]: 0, 
      [ROLES.GUEST]: 0 
    };
    for (const u of users) {
      if (acc[u.role] !== undefined) {
        acc[u.role]++;
      }
    }
    return acc;
  }, [users]);

  function isLastAdmin(id) {
    const admins = users.filter((u) => u.role === ROLES.ADMIN);
    return admins.length === 1 && admins[0].id === id;
  }

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
      const newUser = await api("/users", { method: "POST", body: { 
        email, 
        password: form.password, 
        role: form.role,
        name: email.split('@')[0]
      } });
      
      setUsers((prev) => [newUser, ...prev]);
      toast.show(`Utilisateur créé: ${email}`, "success");
      setForm({ email: "", role: ROLES.BUSINESS_DEVELOPER, password: genPwd() });
    } catch (err) {
      console.error('Erreur création:', err);
      toast.show(err.message || "Erreur création utilisateur", "error");
    }
  };

  // ✅ Ouvrir le modal d'édition
  const openEditModal = (u) => {
    setEditingUser(u);
    setEditForm({
      name: u.name || "",
      role: u.role,
      isActive: u.isActive ?? true
    });
  };

  // ✅ Sauvegarder les modifications
  const saveEdit = async () => {
    if (!editingUser) return;
    
    if (isLastAdmin(editingUser.id) && editForm.role !== ROLES.ADMIN) {
      toast.show("Impossible de retirer le dernier Administrateur.", "error");
      return;
    }
    
    try {
  const updated = await api(`/users/${editingUser.id}`, { method: "PATCH", body: editForm });
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...editForm } : u)));
      toast.show("Utilisateur mis à jour", "success");
      setEditingUser(null);
    } catch (err) {
      console.error('Erreur mise à jour:', err);
      toast.show(err.message || "Erreur mise à jour utilisateur", "error");
    }
  };

  const removeUser = async (id) => {
    if (isLastAdmin(id)) {
      toast.show("Impossible de supprimer le dernier Administrateur.", "error");
      return;
    }
    if (!window.confirm("Supprimer cet utilisateur ?")) return;
    
    try {
  await api(`/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== id));
      toast.show("Utilisateur supprimé", "success");
    } catch (err) {
      console.error('Erreur suppression:', err);
      toast.show(err.message || "Erreur suppression utilisateur", "error");
    }
  };

  const resetPassword = async (id) => {
    const pwd = genPwd();
    try {
  await api(`/users/${id}`, { method: "PATCH", body: { password: pwd } });
      const u = users.find(u => u.id === id);
      toast.show(`Nouveau mot de passe pour ${u?.email} : ${pwd}`, "success");
    } catch (err) {
      console.error('Erreur reset password:', err);
      toast.show(err.message || "Erreur réinit. mot de passe", "error");
    }
  };

  const copyAccess = async (u) => {
    const msg = `Accès Deal Manager\nEmail: ${u.email}\nURL: ${location.origin}/login`;
    try {
      await navigator.clipboard.writeText(msg);
      toast.show("Accès copié dans le presse-papiers.", "success");
    } catch {
      alert(msg);
    }
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) => u.email.toLowerCase().includes(s) || (u.role || "").toLowerCase().includes(s)
    );
  }, [users, q]);

  if (loading || loadingUsers) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-black/70">
        <div className="animate-pulse rounded-xl border border-black/10 bg-white px-4 py-3">
          Chargement…
        </div>
      </div>
    );
  }

  if (!user || user.role !== ROLES.ADMIN) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-gradient-to-b from-orange-50 to-white">
        <div className="rounded-3xl border border-black/10 bg-white px-6 py-8 shadow-sm text-center">
          <div className="mx-auto mb-3 h-12 w-12 rounded-2xl bg-orange-600 text-white grid place-items-center text-xl font-bold">
            403
          </div>
          <h1 className="text-lg font-semibold">Accès Administrateur requis</h1>
          <p className="text-sm text-black/60">Vous n'avez pas les droits pour cette page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ 
            backgroundImage: "radial-gradient(white 1px, transparent 1px)", 
            backgroundSize: "16px 16px" 
          }}
        />
        <div className="relative p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Administration — Utilisateurs
          </h2>
          
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Administrateurs", value: countByRole[ROLES.ADMIN] || 0 },
              { label: "Managers", value: countByRole[ROLES.MANAGER] || 0 },
              { label: "Business Dev", value: countByRole[ROLES.BUSINESS_DEVELOPER] || 0 },
              { label: "Invités", value: countByRole[ROLES.GUEST] || 0 },
            ].map((k) => (
              <div 
                key={k.label} 
                className="rounded-2xl border border-white/20 bg-white/10 backdrop-blur p-3"
              >
                <div className="text-xs text-white/80">{k.label}</div>
                <div className="text-2xl font-semibold">{k.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barre d'action */}
      <div className="flex flex-col md:flex-row gap-3">
        <form 
          onSubmit={addUser} 
          className="flex-1 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
        >
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
                <option key={r} value={r}>{ROLE_BADGES[r]?.label || r}</option>
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
      </div>

      {/* ✅ TABLE AVEC BADGE RÔLE */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="text-left text-black/70">
              <th className="py-2">Email</th>
              <th className="py-2">Rôle</th>
              <th className="py-2">Créé le</th>
              <th className="py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-black/50">
                  Aucun utilisateur
                </td>
              </tr>
            ) : (
              filtered.map((u) => {
                const badge = ROLE_BADGES[u.role] || ROLE_BADGES.GUEST;
                return (
                  <tr key={u.id} className="border-t border-black/5">
                    <td className="py-3">
                      <div>
                        <div className="font-medium text-gray-900">{u.email}</div>
                        {u.name && <div className="text-xs text-gray-500">{u.name}</div>}
                      </div>
                    </td>
                    <td className="py-3">
                      {/* ✅ BADGE RÔLE au lieu du dropdown */}
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="py-3 text-gray-600">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-2">
                        {/* ✅ BOUTON ÉDITER */}
                        <button
                          onClick={() => openEditModal(u)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                        >
                          Éditer
                        </button>
                        <button
                          onClick={() => copyAccess(u)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 transition"
                        >
                          Copier
                        </button>
                        <button
                          onClick={() => resetPassword(u.id)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 transition"
                        >
                          Reset
                        </button>
                        <button
                          onClick={() => removeUser(u.id)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 transition"
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ MODAL D'ÉDITION */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-3xl">
              <h3 className="text-xl font-bold">Modifier l'utilisateur</h3>
              <p className="text-sm text-white/80 mt-1">{editingUser.email}</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Nom */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                  Nom
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Nom de l'utilisateur"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                />
              </div>

              {/* Rôle */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-1.5">
                  Rôle <span className="text-orange-600">*</span>
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>{ROLE_BADGES[r]?.label || r}</option>
                  ))}
                </select>
              </div>

              {/* Statut actif */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Compte actif
                </label>
              </div>

              {/* Info dernière admin */}
              {isLastAdmin(editingUser.id) && editForm.role !== ROLES.ADMIN && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-xs text-red-700">
                      <div className="font-semibold">Attention</div>
                      <div>C'est le dernier administrateur. Impossible de retirer ce rôle.</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 p-6 pt-0">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 transition font-medium text-sm"
              >
                Annuler
              </button>
              <button
                onClick={saveEdit}
                className="px-4 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-500 transition font-semibold text-sm"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}
      
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
