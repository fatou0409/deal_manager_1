import { useEffect, useMemo, useState } from "react";
import DataTablePro from "../../components/DataTablePro";
import ImportExportBar from "../../components/ImportExportBar";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { fmtFCFA, uid } from "../../utils/format";
import { Link } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../lib/api";
import { SECTEURS, SEMESTRES } from "../../utils/constants";

export default function PipeList() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const CAN_UPDATE = can("pipe:update");
  const CAN_DELETE = can("pipe:delete");

  const [editingPipe, setEditingPipe] = useState(null); // Pour le modal d'édition

  // Chargement initial depuis l'API
  useEffect(() => {
    (async () => {
      try {
  const rows = await api(`/pipes?semestre=${encodeURIComponent(state.selectedSemestre)}`);
  dispatch({ type: "SET_PIPES", payload: Array.isArray(rows) ? rows : [] });
      } catch (e) {
        console.warn("GET /pipes failed:", e.message);
      }
    })();
  }, [state.selectedSemestre, dispatch]);

  // Ouvrir le modal d'édition
  const onEditModal = (row) => {
    if (!CAN_UPDATE) return toast.show("Tu n'as pas le droit de modifier une pipe.", "error");
    setEditingPipe({ ...row });
  };

  // Sauvegarde depuis le modal
  const saveEditedPipe = async () => {
    if (!editingPipe) return;
    
    if (!editingPipe.client || !editingPipe.ic || !editingPipe.secteur) {
      return toast.show("Veuillez remplir tous les champs requis.", "error");
    }

    try {
      const payload = {
        ...editingPipe,
        budget: Number(editingPipe.budget || 0),
        semestre: state.selectedSemestre,
      };

  const saved = await api(`/pipes/${editingPipe.id}`, { method: "PUT", body: payload });
      dispatch({ type: "UPDATE_PIPE", payload: saved || payload });
      toast.show("Pipe mise à jour avec succès.", "success");
      setEditingPipe(null);
    } catch (err) {
      console.error("Erreur mise à jour pipe:", err);
      toast.show(`Échec mise à jour : ${err.message}`, "error");
    }
  };

  const onDelete = async (id) => {
    if (!CAN_DELETE) return toast.show("Tu n'as pas le droit de supprimer une pipe.", "error");
    if (!confirm("Supprimer cette pipe ?")) return;
    try {
  await api(`/pipes/${id}`, { method: "DELETE" });
      dispatch({ type: "DELETE_PIPE", payload: id });
      toast.show("Pipe supprimée.", "success");
    } catch (e) {
      toast.show(`Suppression impossible : ${e.message}`, "error");
    }
  };

  const columns = useMemo(
    () => [
      { key: "client", header: "Client" },
      { key: "ic", header: "IC" },
      { key: "secteur", header: "Secteur" },
      { key: "projets", header: "Projets en vue" },
      {
        key: "budget",
        header: "Budget estimatif",
        render: (r) => fmtFCFA(r.budget || 0),
      },
      {
        key: "_actions",
        header: <div className="w-full text-center">Actions</div>,
        render: (r) => (
          <div className="flex items-center justify-center gap-2">
            {CAN_UPDATE && (
              <button 
                onClick={() => onEditModal(r)} 
                className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
              >
                Éditer
              </button>
            )}
            {CAN_DELETE && (
              <button 
                onClick={() => onDelete(r.id)} 
                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
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

  // Import CSV/XLSX → POST API
  const handleImportPipes = async (rowsLower) => {
    const normalized = rowsLower.map((r) => ({
      id: uid(),
      client: r.client || "",
      ic: r.ic || "",
      secteur: r.secteur || "",
      projets: r.projets || "",
      budget: Number(r.budget ?? 0),
      semestre: r.semestre || state.selectedSemestre,
    }));

    try {
        for (const pipe of normalized) {
        const saved = await api("/pipes", { method: "POST", body: pipe });
        dispatch({ type: "ADD_PIPE", payload: saved || pipe });
      }
      toast.show(`Import de ${normalized.length} pipe(s) réussi.`, "success");
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
              Pipe Commercial — {state.selectedSemestre}
            </h2>

            <div className="flex items-center gap-3">
              <ImportExportBar
                resource="pipe"
                title={`Pipes — ${state.selectedSemestre}`}
                filename={`Pipes-${state.selectedSemestre}`}
                columns={columns.filter(c => c.key && !c.key.startsWith("_"))}
                rows={state.pipes}
                onImportRows={handleImportPipes}
              />
              <Link to="/pipe/new" className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white px-3 py-1.5 border border-white/20 hover:bg-white/20 transition text-sm">
                + Nouvelle pipe
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <DataTablePro columns={columns} rows={state.pipes} />
      </div>

      {/* MODAL D'ÉDITION */}
      {editingPipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-3xl">
              <h3 className="text-xl font-bold">Modifier la pipe</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Section 1 : Informations principales */}
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-3">Informations principales</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Client <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingPipe.client || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, client: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      IC (Ingénieur Commercial) <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingPipe.ic || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, ic: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Secteur <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingPipe.secteur || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, secteur: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
                    >
                      <option value="">— Sélectionner —</option>
                      {SECTEURS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Semestre <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingPipe.semestre || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, semestre: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
                    >
                      <option value="">— Sélectionner —</option>
                      {SEMESTRES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2 : Détails de l'opportunité */}
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-3">Détails de l'opportunité</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Projets en vue
                    </label>
                    <textarea
                      value={editingPipe.projets || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, projets: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                      placeholder="Décrivez les projets en cours de discussion..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Budget estimatif (CFA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editingPipe.budget || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, budget: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-2 pt-4 border-t border-black/10">
                <button
                  onClick={() => setEditingPipe(null)}
                  className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEditedPipe}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-500 transition font-semibold"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in { 0% {opacity:0; transform: translateY(10px) scale(0.98);} 100% {opacity:1; transform: translateY(0) scale(1);} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
