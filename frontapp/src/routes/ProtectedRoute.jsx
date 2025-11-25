// src/routes/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Attendre que l'authentification soit chargée
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-orange-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Si pas connecté, rediriger vers login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 🔑 CRITIQUE : Si mustChangePassword = true ET qu'on n'est PAS déjà sur la page de changement
  // alors FORCER la redirection vers /account/change-password
  if (user.mustChangePassword && location.pathname !== "/account/change-password") {
    return <Navigate to="/account/change-password" replace />;
  }

  // Si tout est OK, afficher la route protégée
  return <Outlet />;
}