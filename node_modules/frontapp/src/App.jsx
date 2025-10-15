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
import ProtectedRoute from "./routes/ProtectedRoute";

// Deals & Visits
import DealsList from "./pages/deals/DealsList";
import DealForm from "./pages/deals/DealForm";
import VisitsList from "./pages/visits/VisitsList";
import VisitForm from "./pages/visits/VisitForm";

// Objectives
import ObjectivesList from "./pages/objectives/ObjectivesList";
import ObjectivesForm from "./pages/objectives/ObjectivesForm";

// Pipe
import PipeList from "./pages/pipe/PipeList";
import PipeForm from "./pages/pipe/PipeForm";

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

          {/* Protégé + sidebar */}
          <Route element={<AppShell badges={badges} />}>
            <Route path="/dashboard" element={<Dashboard />} />

            {/* Pipe */}
            <Route path="/pipe" element={<PipeList />} />
            <Route path="/pipe/new" element={<PipeForm />} />

            {/* Deals */}
            <Route path="/deals" element={<DealsList />} />
            <Route path="/deals/new" element={<DealForm />} />

            {/* Visits */}
            <Route path="/visits" element={<VisitsList />} />
            <Route path="/visits/new" element={<VisitForm />} />

            {/* Objectives */}
            <Route path="/objectives" element={<ObjectivesList />} />
            <Route path="/objectives/new" element={<ObjectivesForm />} />
            {/* filet de sécurité pour anciens chemins */}
            <Route path="/objectives/*" element={<Navigate to="/objectives" replace />} />

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
