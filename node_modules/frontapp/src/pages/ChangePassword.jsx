// src/pages/ChangePassword.jsx
import { useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import { Navigate } from "react-router-dom";

export default function ChangePassword() {
  const { user, changePassword } = useAuth();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  if (!user) return <Navigate to="/login" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    if (!form.next || form.next.length < 6) return setErr("Nouveau mot de passe trop court (min. 6).");
    if (form.next !== form.confirm) return setErr("Confirmation différente.");
    try {
      setLoading(true);
      await changePassword({ currentPassword: form.current, newPassword: form.next });
      setOk(true);
    } catch (e) {
      setErr(e.message || "Échec de mise à jour");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] grid place-items-center bg-gradient-to-b from-orange-50 to-white">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Changer mon mot de passe</h1>
        <p className="text-xs text-black/60">Compte : {user.email}</p>

        {ok ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            Mot de passe mis à jour. Vous pouvez désormais accéder à toutes les pages.
          </div>
        ) : (
          <>
            {err && (
              <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm text-orange-700">
                {err}
              </div>
            )}
            <form onSubmit={submit} className="mt-4 space-y-3">
              <label className="block text-sm">
                <span className="block text-[11px] font-semibold text-black/70 uppercase">Mot de passe actuel</span>
                <input
                  type="password"
                  value={form.current}
                  onChange={(e) => setForm({ ...form, current: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-600"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="block text-[11px] font-semibold text-black/70 uppercase">Nouveau mot de passe</span>
                <input
                  type="password"
                  value={form.next}
                  onChange={(e) => setForm({ ...form, next: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-600"
                  required
                />
              </label>
              <label className="block text-sm">
                <span className="block text-[11px] font-semibold text-black/70 uppercase">Confirmer</span>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="mt-1.5 w-full rounded-xl border border-black/10 px-3 py-2 outline-none focus:ring-2 focus:ring-orange-600"
                  required
                />
              </label>
              <button
                disabled={loading}
                className="w-full rounded-xl bg-orange-600 text-white py-2 border border-orange-600 hover:bg-orange-500 disabled:opacity-60"
              >
                {loading ? "Mise à jour…" : "Valider"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
