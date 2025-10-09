// src/pages/ResetAdmin.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function ResetAdmin() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Cette page ne fait plus rien côté client (reset admin = backend uniquement)
    setDone(true);
  }, []);

  return (
    <div className="min-h-[70vh] grid place-items-center bg-gradient-to-b from-orange-50 to-white">
      <div className="w-full max-w-md rounded-3xl border border-black/10 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">Réinitialisation Admin</h1>
        <p className="text-sm text-black/60">
          Cette page a ré-initialisé les utilisateurs locaux et recréé l’admin par défaut.
        </p>

        <div className="mt-4 rounded-xl border border-black/10 bg-orange-50 px-3 py-2 text-sm">
          <div><b>Identifiants Admin</b></div>
          <div>Email : <code>admin@local</code></div>
          <div>Mot de passe : <code>Admin@123</code></div>
        </div>

        {done ? (
          <div className="mt-4 space-y-2">
            <Link to="/login" className="w-full inline-block text-center rounded-xl bg-orange-600 text-white py-2 border border-orange-600 hover:bg-orange-500">
              Aller à la connexion
            </Link>
            <p className="text-xs text-black/60">
              Après la connexion, tu seras redirigé vers la page pour <b>changer ton mot de passe</b>.
            </p>
          </div>
        ) : (
          <div className="mt-4 text-sm text-orange-700">
            Échec de la réinitialisation. Recharge la page et réessaie.
          </div>
        )}
      </div>
    </div>
  );
}
