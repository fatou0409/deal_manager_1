// src/routes/AdminRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider.jsx";

const SKIP = import.meta.env.VITE_SKIP_AUTH === "1";

export default function AdminRoute({ children }) {
  if (SKIP) return children; // bypass en dev
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (!user || user.role !== "ADMIN") return <Navigate to="/dashboard" replace />;
  return children;
}
