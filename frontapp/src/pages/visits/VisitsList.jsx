// src/pages/visits/VisitsList.jsx
import { useEffect, useMemo } from "react";
import DataTablePro from "../../components/DataTablePro";
import ImportExportBar from "../../components/ImportExportBar";
import { useAuth } from "../../auth/AuthProvider";
import { useStore } from "../../store/useStore";
import { Link } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../utils/api";

export default function VisitsList() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const CAN_UPDATE = can("visit:update");
  const CAN_DELETE = can("visit:delete");

  // Chargement initial depuis l’API
  useEffect(() => {
    (async () => {
      try {
        const rows = await api.get(`/visits?semestre=${encodeURIComponent(state.selectedSemestre)}`);
        dispatch({ type: "SET_VISITS", payload: rows || [] });
      } catch (e) {
        console.warn("GET /visits failed:", e.message);
      }
    })();
  }, [state.selectedSemestre, dispatch]);

  const columns = useMemo(
    () => [
      { key: "date", header: "Date" },
      { key: "type", header: "Type" },
      { key: "semestre", header: "Semestre" },
      { key: "client", header: "Client" },
      { key: "secteur", header: "Secteur" },
      { key: "sujet", header: "Sujet" },
      { key: "accompagnants", header: "Accompagnants" },
      {
        key: "_actions",
        header: <div className="w-full text-center">Actions</div>,
        render: (r) => (
          <div className="flex justify-center gap-2">
            {CAN_UPDATE && (
              <button className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700">
                Éditer
              </button>
            )}
            {CAN_DELETE && (
              <button
                onClick={async () => {
                  if (!confirm("Supprimer ?")) return;
                  try {
                    await api.del(`/visits/${r.id}`);
                    dispatch({ type: "DELETE_VISIT", payload: r.id });
                    toast.show("Visite supprimée.", "success");
                  } catch (e) {
                    toast.show(`Suppression impossible : ${e.message}`, "error");
                  }
                }}
                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700"
              >
                Supprimer
              </button>
            )}
          </div>
        ),
      },
    ],
    [CAN_UPDATE, CAN_DELETE, dispatch, toast]
  );

  // Import CSV/XLSX → POST API
  const handleImportVisits = async (rowsLower) => {
    const normalized = rowsLower.map((r) => ({
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      date: r.date || "",
      type: r.type || "",
      semestre: r.semestre || state.selectedSemestre,
      client: r.client || "",
      secteur: r.secteur || "",
      sujet: r.sujet || "",
      accompagnants: r.accompagnants || "",
    }));
    try {
      for (const v of normalized) {
        const saved = await api.post("/visits", v);
        dispatch({ type: "ADD_VISIT", payload: saved || v });
      }
      toast.show(`Import de ${normalized.length} visite(s) réussi.`, "success");
    } catch (e) {
      toast.show(`Import interrompu : ${e.message}`, "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO / HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white shadow-2xl">
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Historique des visites</h2>
            <div className="flex items-center gap-3">
              <ImportExportBar
                resource="visit"
                title={`Visites — ${state.selectedSemestre}`}
                filename={`Visites-${state.selectedSemestre}`}
                columns={columns.filter(c => c.key && !c.key.startsWith("_"))}
                rows={state.visits}
                onImportRows={handleImportVisits}
              />
              <Link to="/visits/new" className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white px-3 py-1.5 border border-white/20 hover:bg-white/20 transition text-sm">
                + Nouvelle visite
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <DataTablePro columns={columns} rows={state.visits} empty="Aucune visite" />
      </div>

      <style>{`
        @keyframes fade-in { 0% {opacity:0; transform: translateY(10px) scale(0.98);} 100% {opacity:1; transform: translateY(0) scale(1);} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
