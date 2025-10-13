// src/pages/deals/DealsList.jsx
import { useMemo } from "react";
import DataTablePro from "../../components/DataTablePro";
import ImportExportBar from "../../components/ImportExportBar";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { fmtFCFA } from "../../utils/format";
import { Link } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { uid } from "../../utils/format";

export default function DealsList() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const CAN_UPDATE = can("deal:update");
  const CAN_DELETE = can("deal:delete");

  const dealsOfSemestre = useMemo(
    () => state.deals.filter((d) => d.semestre === state.selectedSemestre),
    [state.deals, state.selectedSemestre]
  );

  const onEdit = (row) => {
    if (!CAN_UPDATE) return toast.show("Tu n’as pas le droit de modifier un deal.", "error");
    // Si page d'édition, redirige vers /deals/:id/edit
  };

  const onDelete = (id) => {
    if (!CAN_DELETE) return toast.show("Tu n’as pas le droit de supprimer un deal.", "error");
    if (confirm("Supprimer ce deal ?")) {
      dispatch({ type: "DELETE_DEAL", payload: id });
      toast.show("Deal supprimé.", "success");
    }
  };

  const columns = useMemo(
    () => [
      { key: "projet", header: "Projet" },
      { key: "client", header: "Client" },
      { key: "secteur", header: "Secteur" },
      { key: "semestre", header: "Semestre" },
      {
        key: "ca",
        header: "CA",
        render: (r) => {
          const isGagne = (r.statut || "").toLowerCase().startsWith("gagn");
          return fmtFCFA(isGagne ? r.ca : 0);
        },
      },
      {
        key: "marge",
        header: "Marge",
        render: (r) => {
          const isGagne = (r.statut || "").toLowerCase().startsWith("gagn");
          return fmtFCFA(isGagne ? r.marge : 0);
        },
      },
      { key: "statut", header: "Statut" },
      {
        key: "_actions",
        header: <div className="w-full text-center">Actions</div>,
        render: (r) => (
          <div className="flex items-center justify-center gap-2">
            {CAN_UPDATE && (
              <button onClick={() => onEdit(r)} className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700">
                Éditer
              </button>
            )}
            {CAN_DELETE && (
              <button onClick={() => onDelete(r.id)} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700">
                Supprimer
              </button>
            )}
          </div>
        ),
      },
    ],
    [CAN_UPDATE, CAN_DELETE]
  );

  // Handler d'import (CSV/XLSX) — mappe les colonnes basiques
  const handleImportDeals = (rowsLower) => {
    const normalized = rowsLower.map((r) => ({
      id: uid(),
      projet: r.projet || "",
      client: r.client || "",
      secteur: r.secteur || "",
      semestre: r.semestre || state.selectedSemestre,
      ca: Number(r.ca ?? 0),
      marge: Number(r.marge ?? 0),
      typeDeal: r.typedeal || r["type de deal"] || "",
      commercial: r.commercial || "",
      supportAV: r.supportav || "",
      statut: r.statut || "",
      dateCreation: r.datecreation || r["date de création"] || "",
      dateDerniereModif: new Date().toISOString().slice(0, 10),
    }));

    normalized.forEach((d) => dispatch({ type: "ADD_DEAL", payload: d }));
    toast.show(`Import de ${normalized.length} deal(s) réussi.`, "success");
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-600 to-black text-white p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Liste des Deals — {state.selectedSemestre}</h2>
          <div className="flex items-center gap-3">
            {/* Import / Export */}
            <ImportExportBar
              resource="deal"
              title={`Deals — ${state.selectedSemestre}`}
              filename={`Deals-${state.selectedSemestre}`}
              columns={columns.filter(c => c.key && !c.key.startsWith("_"))}
              rows={dealsOfSemestre}
              onImportRows={handleImportDeals}
            />
            <Link to="/deals/new" className="rounded-xl bg-white/10 border border-white/20 px-3 py-1.5 text-sm hover:bg-white/20">
              + Nouveau deal
            </Link>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-lg">
        <DataTablePro columns={columns} rows={dealsOfSemestre} />
      </div>
    </div>
  );
}
