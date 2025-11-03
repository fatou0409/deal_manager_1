// src/components/Footer.jsx
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { ROLES } from "../auth/permissions";

function Footer() {
  const { user } = useAuth();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-10 border-t border-black/10 bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8 grid gap-6 md:grid-cols-3 text-sm">
        <div>
          <div className="text-lg font-semibold text-orange-600">Deal Manager</div>
          <p className="mt-2 text-black/60">Pilotez vos deals, visites et KPIs semestriels.</p>
        </div>

        <div>
          <div className="font-semibold mb-2">Navigation</div>
          <nav className="grid gap-1">
            <Link className="hover:text-orange-600" to="/">Accueil</Link>
            <Link className="hover:text-orange-600" to="/dashboard">Tableau de bord</Link>
            <Link className="hover:text-orange-600" to="/dashboard">Objectifs</Link>
            <Link className="hover:text-orange-600" to="/deals">Deals</Link>
            <Link className="hover:text-orange-600" to="/visits">Visites & Suivi</Link>
            {user?.role === ROLES.ADMIN && (
              <Link className="hover:text-orange-600" to="/admin/users">Administration</Link>
            )}
          </nav>
        </div>

        <div>
          <div className="font-semibold mb-2">Compte</div>
          <nav className="grid gap-1">
            {!user ? (
              <Link className="hover:text-orange-600" to="/login">Se connecter</Link>
            ) : (
              <>
                <span className="text-black/60">Connecté en <b>{user.role}</b></span>
                <Link className="hover:text-orange-600" to="/dashboard">Aller au Tableau de bord</Link>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="border-t border-black/10">
        <div className="max-w-7xl mx-auto px-4 py-4 text-xs text-black/60 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <span>© {year} Deal Manager</span>
          
        </div>
      </div>
    </footer>
  );
}

export default Footer;  // ⬅️ export par défaut
