// src/pages/visits/VisitsList.jsx
import { useMemo } from "react";
import DataTablePro from "../../components/DataTablePro";
import ImportExportBar from "../../components/ImportExportBar";
import { useAuth } from "../../auth/AuthProvider";
import { useStore } from "../../store/useStore";
import { Link } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";

export default function VisitsList() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const CAN_UPDATE = can("visit:update");
  const CAN_DELETE = can("visit:delete");

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
        header: "Actions",
        render: (r) => (
          <div className="flex justify-center gap-2">
            {CAN_UPDATE && (
              <button className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700">
                Éditer
              </button>
            )}
            {CAN_DELETE && (
              <button
                onClick={() => {
                  if (!confirm("Supprimer ?")) return;
                  dispatch({ type: "DELETE_VISIT", payload: r.id });
                  toast.show("Visite supprimée.", "success");
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
    [CAN_UPDATE, CAN_DELETE]
  );

  // Handler d'import visites
  const handleImportVisits = (rowsLower) => {
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
    normalized.forEach((v) => dispatch({ type: "ADD_VISIT", payload: v }));
    toast.show(`Import de ${normalized.length} visite(s) réussi.`, "success");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-600 to-black text-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Historique des visites</h2>
          <div className="flex items-center gap-3">
            <ImportExportBar
              resource="visit"
              title={`Visites — ${state.selectedSemestre}`}
              filename={`Visites-${state.selectedSemestre}`}
              columns={columns.filter(c => c.key && !c.key.startsWith("_"))}
              rows={state.visits}
              onImportRows={handleImportVisits}
            />
            <Link to="/visits/new" className="rounded-xl bg-white/10 border border-white/20 px-3 py-1.5 text-sm hover:bg-white/20">
              + Nouvelle visite
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-lg">
        <DataTablePro columns={columns} rows={state.visits} empty="Aucune visite" />
      </div>
    </div>
  );
}
