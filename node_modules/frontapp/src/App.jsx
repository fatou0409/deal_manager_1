// ...existing code...
// src/App.jsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Objectives from "./pages/Objectives";
import Deals from "./pages/Deals";
import Visits from "./pages/Visits";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import ChangePassword from "./pages/ChangePassword";
import ResetAdmin from "./pages/ResetAdmin";
import Pipe from "./pages/Pipe"; 
import ProtectedRoute from "./routes/ProtectedRoute";

// Composant de Layout pour les routes protégées
const ProtectedLayout = () => (
  <ProtectedRoute>
    <Outlet />
  </ProtectedRoute>
);

export default function App() {
  const badges = { deals: undefined, visits: undefined };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      {/* Ta barre du haut existante */}
      <Navbar />

      {/* Coque + Sidebar blanche + contenu */}
      <AppShell badges={badges}>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-admin" element={<ResetAdmin />} />

          {/* Compte */}
          <Route element={<ProtectedLayout />}>
            <Route path="/account/change-password" element={<ChangePassword />} />
          </Route>

          {/* Zones protégées */}
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/objectives" element={<Objectives />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/pipe" element={<Pipe />} />
            <Route path="/visits" element={<Visits />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedLayout />}>
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
          
      {/* Ton footer d’origine */}
      <Footer />
    </div>
  );
}
