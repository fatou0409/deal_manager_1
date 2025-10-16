// src/pages/visits/VisitsList.jsx - VERSION CORRIGÉE
import { useEffect, useMemo, useState } from "react";
import DataTablePro from "../../components/DataTablePro";
import ImportExportBar from "../../components/ImportExportBar";
import { useAuth } from "../../auth/AuthProvider";
import { useStore } from "../../store/useStore";
import { Link } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../utils/api";
import { SECTEURS, SEMESTRES, TYPES_VISITE } from "../../utils/constants";

export default function VisitsList() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const CAN_UPDATE = can("visit:update");
  const CAN_DELETE = can("visit:delete");

  const [editingVisit, setEditingVisit] = useState(null); // Pour le modal d'édition

  // Helper pour convertir Date ISO -> yyyy-MM-dd pour input type="date"
  const toDateInputValue = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return "";
    }
  };

  // Chargement initial depuis l'API
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

  // Ouvrir le modal d'édition
  const onEdit = (row) => {
    if (!CAN_UPDATE) return toast.show("Tu n'as pas le droit de modifier une visite.", "error");
    setEditingVisit({ ...row });
  };

  // Sauvegarde depuis le modal
  const saveEditedVisit = async () => {
    if (!editingVisit) return;
    
    try {
      const payload = {
        ...editingVisit,
        // S'assurer que date est au format yyyy-MM-dd
        date: toDateInputValue(editingVisit.date),
      };

      const saved = await api.put(`/visits/${editingVisit.id}`, payload);
      dispatch({ type: "UPDATE_VISIT", payload: saved || editingVisit });
      toast.show("Visite mise à jour avec succès.", "success");
      setEditingVisit(null);
    } catch (err) {
      console.error("Erreur mise à jour visite:", err);
      toast.show(`Échec mise à jour : ${err.message}`, "error");
    }
  };

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
              <button 
                onClick={() => onEdit(r)}
                className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
              >
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
                className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
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

      {/* MODAL D'ÉDITION */}
      {editingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-3xl">
              <h3 className="text-xl font-bold">Modifier la visite</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Section 1 : Planification */}
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-3">Planification</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Date <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={toDateInputValue(editingVisit.date)}
                      onChange={(e) => setEditingVisit({ ...editingVisit, date: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Type <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingVisit.type || ""}
                      onChange={(e) => setEditingVisit({ ...editingVisit, type: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
                    >
                      <option value="">— Sélectionner —</option>
                      {TYPES_VISITE.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Semestre <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingVisit.semestre || ""}
                      onChange={(e) => setEditingVisit({ ...editingVisit, semestre: e.target.value })}
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

              {/* Section 2 : Détails client */}
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-3">Détails client</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Client <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingVisit.client || ""}
                      onChange={(e) => setEditingVisit({ ...editingVisit, client: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Secteur <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingVisit.secteur || ""}
                      onChange={(e) => setEditingVisit({ ...editingVisit, secteur: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
                    >
                      <option value="">— Sélectionner —</option>
                      {SECTEURS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Sujet <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingVisit.sujet || ""}
                      onChange={(e) => setEditingVisit({ ...editingVisit, sujet: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Accompagnants
                    </label>
                    <input
                      type="text"
                      value={editingVisit.accompagnants || ""}
                      onChange={(e) => setEditingVisit({ ...editingVisit, accompagnants: e.target.value })}
                      placeholder="Noms séparés par des virgules"
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-2 pt-4 border-t border-black/10">
                <button
                  onClick={() => setEditingVisit(null)}
                  className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEditedVisit}
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