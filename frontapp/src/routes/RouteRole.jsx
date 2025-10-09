// src/routes/RoleRoute.jsx
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function RoleRoute({ allow = [], children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[40vh] grid place-items-center text-black/70">
        <div className="animate-pulse rounded-xl border border-black/10 bg-white px-4 py-3">Chargement…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  const ok = allow.includes(user.role);
  return ok ? children : <Navigate to="/403" replace />;
}
