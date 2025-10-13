import { Outlet, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth();

  const location = useLocation();
  if (isLoading) return null; // ou un spinner léger si tu veux

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
