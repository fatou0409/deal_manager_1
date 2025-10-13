// src/components/AppShell.jsx
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function AppShell({ badges }) {
  return (
    <div className="flex-1 bg-white">
      <div className="mx-auto max-w-7xl flex gap-6 px-4">
        <Sidebar badges={badges} />
        <main className="flex-1 py-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
