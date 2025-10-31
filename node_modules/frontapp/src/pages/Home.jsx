// src/pages/Home.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  const cards = [
    {
      to: "/deals",
      title: "Gestion des deals",
      desc: "Créer, modifier et suivre vos opportunités commerciales.",
      badge: "Deals",
    },
    {
      to: "/visits",
      title: "Visites & suivi",
      desc: "Planifier et tracer les visites, ateliers et one-to-one.",
      badge: "Visites",
    },
    {
      to: "/dashboard",
      title: "Tableau de bord",
      desc: "Visualiser CA, marge, objectifs et analyses par semestre.",
      badge: "TDB",
    },
  ];

  // Tu peux, si tu veux, exposer une tuile Admin visible seulement pour l’Administrateur.
  const adminCard =
    user?.role === "Administrateur"
      ? [
          {
            to: "/admin/users",
            title: "Gestion des utilisateurs",
            desc: "Créer des comptes, attribuer des rôles et réinitialiser les accès.",
            badge: "Admin",
          },
        ]
      : [];

  const allCards = [...cards, ...adminCard];

  return (
    <div className="min-h-[70vh] grid place-items-center bg-gradient-to-b from-orange-50 to-white animate-fade-in">
      <div className="w-full max-w-5xl">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white mb-6 shadow-2xl backdrop-blur-xl animate-fade-in">
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(white 1px, transparent 1px)",
              backgroundSize: "16px 16px",
            }}
          />
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
          <div className="relative p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Bienvenue sur Deal Manager
            </h1>
            <p className="mt-1 text-white/80 text-sm md:text-base max-w-3xl">
              Centralisez vos deals, planifiez vos visites et suivez vos objectifs
              semestriels.
            </p>
          </div>
        </div>

        {/* Cartes de navigation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{animationDelay: '0.1s'}}>
          {allCards.map((c, i) => (
            <Link
              key={c.to}
              to={c.to}
              className="group rounded-3xl border border-black/10 bg-white/80 p-5 shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-[2px] focus:outline-none focus:ring-2 focus:ring-orange-500 animate-fade-in"
              style={{animationDelay: `${0.15 + i * 0.05}s`}}
            >
              <div className="mb-3 inline-flex items-center gap-2">
                <div className="h-10 w-10 rounded-2xl bg-orange-600 grid place-items-center text-white font-bold shadow">
                  {c.badge}
                </div>
              </div>
              <div className="font-semibold text-black">{c.title}</div>
              <div className="text-sm text-black/60">{c.desc}</div>
              <div className="mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs border border-orange-600 text-orange-700 group-hover:bg-orange-50 transition-all duration-200">
                Ouvrir
                <svg
                  className="h-3.5 w-3.5 opacity-80"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M7 17l9-9" />
                  <path d="M7 7h9v9" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
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
