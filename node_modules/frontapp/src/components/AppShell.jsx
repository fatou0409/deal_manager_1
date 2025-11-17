// src/components/AppShell.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppShell({ badges }) {
  return (
    <div className="flex-1 bg-white">
      <Sidebar badges={badges} />
      <main className="ml-64 py-4 px-4 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
