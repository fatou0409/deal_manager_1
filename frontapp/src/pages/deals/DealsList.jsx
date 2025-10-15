// src/pages/deals/DealsList.jsx
import { useEffect, useMemo } from "react";
import DataTablePro from "../../components/DataTablePro";
import ImportExportBar from "../../components/ImportExportBar";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { fmtFCFA, uid } from "../../utils/format";
import { Link } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../utils/api";

export default function DealsList() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const CAN_UPDATE = can("deal:update");
  const CAN_DELETE = can("deal:delete");

  // Chargement initial depuis l’API
  useEffect(() => {
    (async () => {
      try {
        const rows = await api.get(`/deals?semestre=${encodeURIComponent(state.selectedSemestre)}`);
        dispatch({ type: "SET_DEALS", payload: rows || [] });
      } catch (e) {
        // on garde le store local si l’API ne répond pas
        console.warn("GET /deals failed:", e.message);
      }
    })();
  }, [state.selectedSemestre, dispatch]);

  const dealsOfSemestre = useMemo(
    () => state.deals.filter((d) => d.semestre === state.selectedSemestre),
    [state.deals, state.selectedSemestre]
  );

  const onEdit = (row) => {
    if (!CAN_UPDATE) return toast.show("Tu n’as pas le droit de modifier un deal.", "error");
    // redirection si tu as une page d'édition
  };

  const onDelete = async (id) => {
    if (!CAN_DELETE) return toast.show("Tu n’as pas le droit de supprimer un deal.", "error");
    if (!confirm("Supprimer ce deal ?")) return;
    try {
      await api.del(`/deals/${id}`);
      dispatch({ type: "DELETE_DEAL", payload: id });
      toast.show("Deal supprimé.", "success");
    } catch (e) {
      toast.show(`Suppression impossible : ${e.message}`, "error");
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
        render: (r) => (/gagn[ée]?/i.test(r.statut || "") ? fmtFCFA(r.ca) : fmtFCFA(0)),
      },
      {
        key: "marge",
        header: "Marge",
        render: (r) => (/gagn[ée]?/i.test(r.statut || "") ? fmtFCFA(r.marge) : fmtFCFA(0)),
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

  // Import CSV/XLSX → POST API
  const handleImportDeals = async (rowsLower) => {
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

    try {
      // si tu n’as pas de /deals/bulk, on fait simple : POST 1 par 1
      for (const d of normalized) {
        const saved = await api.post("/deals", d);
        dispatch({ type: "ADD_DEAL", payload: saved || d });
      }
      toast.show(`Import de ${normalized.length} deal(s) réussi.`, "success");
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Liste des Deals — {state.selectedSemestre}
            </h2>

            <div className="flex items-center gap-3">
              <ImportExportBar
                resource="deal"
                title={`Deals — ${state.selectedSemestre}`}
                filename={`Deals-${state.selectedSemestre}`}
                columns={columns.filter(c => c.key && !c.key.startsWith("_"))}
                rows={dealsOfSemestre}
                onImportRows={handleImportDeals}
              />
              <Link to="/deals/new" className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white px-3 py-1.5 border border-white/20 hover:bg-white/20 transition text-sm">
                + Nouveau deal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <DataTablePro columns={columns} rows={dealsOfSemestre} />
      </div>

      <style>{`
        @keyframes fade-in { 0% {opacity:0; transform: translateY(10px) scale(0.98);} 100% {opacity:1; transform: translateY(0) scale(1);} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
