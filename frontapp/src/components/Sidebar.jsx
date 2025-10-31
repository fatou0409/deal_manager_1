// src/components/Sidebar.jsx
import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

function Icon({ name, className = "h-5 w-5" }) {
  const props = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "home": return (<svg viewBox="0 0 24 24" {...props}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 10v10h14V10"/></svg>);
    case "dashboard": return (<svg viewBox="0 0 24 24" {...props}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>);
    case "target": return (<svg viewBox="0 0 24 24" {...props}><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/></svg>);
    case "briefcase": return (<svg viewBox="0 0 24 24" {...props}><path d="M4 7h16a2 2 0 0 1 2 2v8H2V9a2 2 0 0 1 2-2Z"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg>);
    case "calendar": return (<svg viewBox="0 0 24 24" {...props}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>);
    case "users": return (<svg viewBox="0 0 24 24" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>);
    default: return null;
  }
}

function Item({ to, end, icon, label, badge }) {
  const base = "flex items-center gap-3 px-4 py-2 rounded-xl font-medium transition-all duration-200 group";
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          base,
          isActive
            ? "bg-orange-600 text-white shadow-lg scale-[1.03]"
            : "text-gray-800 hover:bg-orange-50 hover:scale-[1.02] hover:shadow-md",
        ].join(" ")
      }
    >
      <Icon name={icon} className="h-5 w-5 opacity-80 group-hover:opacity-100" />
      <span className="flex-1 text-base tracking-tight">{label}</span>
      {badge != null && (
        <span className="ml-auto inline-flex min-w-[1.5rem] justify-center rounded-full bg-orange-600 px-1.5 py-0.5 text-xs font-bold text-white shadow">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

export default function Sidebar({ badges = {} }) {
  const { user } = useAuth();
  
  // ✅ Vérification des rôles pour afficher "Objectifs"
  const canManageObjectives = user?.role === "ADMIN" || user?.role === "MANAGER";

  return (
    <aside className="w-64 shrink-0">
      <div className="sticky top-16 h-[calc(100vh-64px)] overflow-y-auto bg-white px-4 py-6 shadow-xl rounded-r-3xl border-r border-gray-100">
        <nav className="flex flex-col gap-1">
          {/* Pages principales */}
          <Item to="/" end icon="home" label="Accueil" />
          <Item to="/dashboard" icon="dashboard" label="Tableau de bord" />

          {/* Deal = liste par défaut */}
          <Item to="/deals" end icon="briefcase" label="Deal" badge={badges.deals} />

          {/* Visites & Suivi = historique par défaut */}
          <Item to="/visits" end icon="calendar" label="Visites & Suivi" badge={badges.visits} />

          {/* ✅ Objectifs -> visible uniquement pour ADMIN et MANAGER */}
          {canManageObjectives && (
            <Item to="/objectives" icon="target" label="Objectifs" />
          )}

          {/* Pipe */}
          <Item to="/pipe" icon="dashboard" label="Pipe" />

          {/* Admin */}
          {user?.role === "ADMIN" && (
            <Item to="/admin/users" icon="users" label="Gestion des utilisateurs" />
          )}
        </nav>
      </div>
    </aside>
  );
}

Icon.propTypes = { name: PropTypes.string.isRequired, className: PropTypes.string };
Item.propTypes = { to: PropTypes.string.isRequired, end: PropTypes.bool, icon: PropTypes.string, label: PropTypes.string.isRequired, badge: PropTypes.any };
Sidebar.propTypes = { badges: PropTypes.object };