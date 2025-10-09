// src/pages/Login.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";



export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("admin@deal.test");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login({ email, password });
  nav(from, { replace: true });
    } catch (err) {
  setError(err.message || "Échec de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-orange-50 to-white py-8">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white shadow-lg p-8">
        <h1 className="text-2xl font-bold text-center text-orange-700 mb-6 tracking-tight">Connexion</h1>
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-gray-600">Email</label>
            <input
              id="email"
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="Votre email"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-gray-600">Mot de passe</label>
            <div className="flex">
              <input
                id="password"
                type={showPwd ? "text" : "password"}
                className="w-full rounded-l-xl border border-black/10 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-600"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Votre mot de passe"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="rounded-r-xl border border-l-0 border-black/10 px-3 flex items-center justify-center text-gray-600 hover:bg-orange-50"
                aria-label={showPwd ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                tabIndex={0}
              >
                {showPwd ? (
                  // Icône œil barré
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.657.403-3.22 1.125-4.575M6.343 6.343A7.963 7.963 0 004 9c0 4.418 3.582 8 8 8 1.657 0 3.22-.403 4.575-1.125M17.657 17.657A7.963 7.963 0 0020 15c0-4.418-3.582-8-8-8-1.657 0-3.22.403-4.575 1.125M3 3l18 18" />
                  </svg>
                ) : (
                  // Icône œil
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-9 0c0 5.25 7.5 9 7.5 9s7.5-3.75 7.5-9a7.5 7.5 0 10-15 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-2 text-sm text-red-700 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full rounded-xl bg-orange-600 px-4 py-2 text-white font-semibold shadow hover:bg-orange-500 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
