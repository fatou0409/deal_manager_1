// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AppShell from "./components/AppShell";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import AdminUsers from "./pages/AdminUsers";
import ChangePassword from "./pages/ChangePassword";
import ResetAdmin from "./pages/ResetAdmin";
import Pipe from "./pages/Pipe";
import ProtectedRoute from "./routes/ProtectedRoute";

// Pages
import DealsList from "./pages/deals/DealsList";
import DealForm from "./pages/deals/DealForm";
import VisitsList from "./pages/visits/VisitsList";
import VisitForm from "./pages/visits/VisitForm";
import Objectives from "./pages/objectives/Objectives"; // <- fusion edit + history

export default function App() {
  const badges = { deals: undefined, visits: undefined };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-admin" element={<ResetAdmin />} />

        {/* Protégé (sans sidebar) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/account/change-password" element={<ChangePassword />} />

          {/* Protégé + sidebar (AppShell rend Sidebar + <Outlet/>) */}
          <Route element={<AppShell badges={badges} />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/pipe" element={<Pipe />} />

            {/* Deals */}
            <Route path="/deals" element={<DealsList />} />
            <Route path="/deals/new" element={<DealForm />} />

            {/* Visits */}
            <Route path="/visits" element={<VisitsList />} />
            <Route path="/visits/new" element={<VisitForm />} />

            {/* Objectives (même composant sur 2 routes) */}
            <Route path="/objectives/edit" element={<Objectives />} />
            <Route path="/objectives/history" element={<Objectives />} />
            {/* Optionnel : racine objectives -> edit
                <Route path="/objectives" element={<Navigate to="/objectives/edit" replace />} />
            */}

            {/* Admin */}
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Footer />
    </div>
  );
}
