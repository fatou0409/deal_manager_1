// src/components/Navbar.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider"; // adapte le chemin si besoin

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const onLogout = logout ?? (() => {});

  let authZone;
  if (loading) {
    authZone = <span className="opacity-90 animate-pulse">…</span>;
  } else if (user) {
    authZone = (
      <>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline opacity-90 font-medium">
            {user.email || user.name}
          </span>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-600 font-bold border border-orange-200 shadow-sm">
            {(user.email?.[0] ?? user.name?.[0] ?? "U").toUpperCase()}
          </span>
        </div>
        <button
          onClick={onLogout}
          className="rounded-full bg-white text-orange-700 px-4 py-1.5 border border-orange-200 font-semibold shadow hover:bg-orange-50 hover:text-orange-900 transition"
        >
          Déconnexion
        </button>
      </>
    );
  } else {
    authZone = (
      <Link
        to="/login"
        className="rounded-full bg-white text-orange-700 px-4 py-1.5 border border-orange-200 font-semibold shadow hover:bg-orange-50 hover:text-orange-900 transition"
      >
        Se connecter
      </Link>
    );
  }

  return (
    <header className="sticky top-0 z-40 shadow-lg bg-gradient-to-r from-orange-600 to-orange-700 text-white animate-fade-in">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex items-center justify-between py-3">
          {/* Logo / Marque */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-2xl bg-white text-orange-600 grid place-items-center font-extrabold text-lg shadow group-hover:scale-105 transition-transform">
              DM
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight drop-shadow-sm">
              DealsManager
            </h1>
          </Link>

          {/* Zone connexion / déconnexion */}
          <div className="flex items-center gap-3 text-xs sm:text-sm">
            {authZone}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(-10px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.5s cubic-bezier(.4,0,.2,1); }
      `}</style>
    </header>
  );
}
