// src/components/AppShell.jsx
import Sidebar from "./Sidebar";

/**
 * Mise en page type “exemple” : grande zone de contenu à droite,
 * sidebar fixe à gauche, fond global blanc, sans traits/bordures.
 * Tu gardes ton Navbar/ Footer dans App.jsx.
 */
export default function AppShell({ children }) {
  return (
    <div className="flex-1 bg-white">
      <div className="mx-auto max-w-7xl flex gap-6 px-4">
        <Sidebar />
        <main className="flex-1 py-4">
          {children}
        </main>
      </div>
    </div>
  );
}
