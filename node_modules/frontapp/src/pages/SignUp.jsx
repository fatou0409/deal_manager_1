// src/pages/SignUp.jsx
import { useState } from "react";
import { Navigate, useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { ROLES } from "../auth/permissions";

const SIGNUP_ROLES = [ROLES.BD, ROLES.GUEST]; // on n'autorise pas ADMIN à l'inscription publique

export default function SignUp() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [form, setForm] = useState({
    lastName: "",     // Nom
    firstName: "",    // Prénom
    email: "",
    password: "",
    confirm: "",
    role: ROLES.GUEST,
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (user) return <Navigate to={redirectTo} replace />;

  const validate = () => {
    const lastName = form.lastName.trim();
    const firstName = form.firstName.trim();
    const email = form.email.trim().toLowerCase();

    if (!lastName || lastName.length < 2) return "Le nom est requis (min. 2 caractères).";
    if (!firstName || firstName.length < 2) return "Le prénom est requis (min. 2 caractères).";
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Adresse email invalide.";
    if (!form.password || form.password.length < 6) return "Le mot de passe doit contenir au moins 6 caractères.";
    if (form.password !== form.confirm) return "Les mots de passe ne correspondent pas.";
    if (!SIGNUP_ROLES.includes(form.role)) return "Rôle non autorisé pour l'inscription.";

    const users = loadUsers();
    if (users.some((u) => (u.email || "").toLowerCase() === email)) return "Cet email est déjà enregistré.";
    return "";
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const msg = validate();
    if (msg) {
      setErr(msg);
      return;
    }
    setLoading(true);
    try {
      const email = form.email.trim().toLowerCase();

  // 2) Auto-login via backend
  await login({ email, password: form.password });

  // 3) Redirection
  navigate(redirectTo, { replace: true });
    } catch (e) {
      setErr(e.message || "Échec de création de compte");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center bg-gradient-to-b from-orange-50 to-white">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <div className="text-center mb-4">
          <div className="mx-auto mb-2 h-10 w-10 rounded-2xl bg-orange-600 grid place-items-center text-white font-bold">
            +
          </div>
          <h1 className="text-lg font-semibold">Créer un compte</h1>
          <p className="text-sm text-black/60">Inscription pour accéder à l’espace</p>
        </div>

        {err && (
          <div className="mb-3 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
            {err}
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          {/* Nom & Prénom (ordre demandé: Nom, Prénom) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[11px] font-semibold tracking-wide text-black/70 uppercase">Nom</span>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                required
                className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
                placeholder="ex: Ndiaye"
              />
            </label>

            <label className="block">
              <span className="block text-[11px] font-semibold tracking-wide text-black/70 uppercase">Prénom</span>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                required
                className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
                placeholder="ex: Fatou"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-[11px] font-semibold tracking-wide text-black/70 uppercase">Adresse email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
              placeholder="email@exemple.com"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[11px] font-semibold tracking-wide text-black/70 uppercase">Mot de passe</span>
              <div className="mt-1.5 relative">
                <input
                  type={showPwd ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                  className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute inset-y-0 right-2 my-auto text-xs text-black/60"
                >
                  {showPwd ? "Masquer" : "Afficher"}
                </button>
              </div>
            </label>

            <label className="block">
              <span className="block text-[11px] font-semibold tracking-wide text-black/70 uppercase">Confirmer</span>
              <input
                type={showPwd ? "text" : "password"}
                value={form.confirm}
                onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                required
                className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
                placeholder="••••••••"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-[11px] font-semibold tracking-wide text-black/70 uppercase">Rôle</span>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="mt-1.5 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
            >
              {SIGNUP_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === ROLES.BD ? "Business Developer" : "Invité"}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-black/60">
              Le rôle <b>Administrateur</b> ne peut être attribué que par un Admin.
            </p>
          </label>

          <button
            disabled={loading}
            className="w-full rounded-xl bg-orange-600 text-white py-2 border border-orange-600 hover:bg-orange-500 disabled:opacity-60"
          >
            {loading ? "Création…" : "Créer le compte"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-black/60">
          Déjà inscrit ?{" "}
          <Link to="/login" className="text-orange-700 hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  );
}
