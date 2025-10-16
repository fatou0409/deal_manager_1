// src/pages/deals/DealsList.jsx - VERSION CORRIGÉE
import { useEffect, useMemo, useState } from "react";
import DataTablePro from "../../components/DataTablePro";
import ImportExportBar from "../../components/ImportExportBar";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { fmtFCFA, uid } from "../../utils/format";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../utils/api";
import { SECTEURS, SEMESTRES, TYPES_DEAL, COMMERCIAUX, AV_SUPPORTS, STATUTS } from "../../utils/constants";

export default function DealsList() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const CAN_UPDATE = can("deal:update");
  const CAN_DELETE = can("deal:delete");

  const [editingDeal, setEditingDeal] = useState(null); // Pour le modal d'édition

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
        const rows = await api.get(`/deals?semestre=${encodeURIComponent(state.selectedSemestre)}`);
        dispatch({ type: "SET_DEALS", payload: rows || [] });
      } catch (e) {
        console.warn("GET /deals failed:", e.message);
      }
    })();
  }, [state.selectedSemestre, dispatch]);

  const dealsOfSemestre = useMemo(
    () => state.deals.filter((d) => d.semestre === state.selectedSemestre),
    [state.deals, state.selectedSemestre]
  );

  // OPTION 1 : Redirection vers page d'édition
  const onEditRedirect = (row) => {
    if (!CAN_UPDATE) return toast.show("Tu n'as pas le droit de modifier un deal.", "error");
    navigate(`/deals/${row.id}/edit`);
  };

  // OPTION 2 : Ouvrir un modal d'édition
  const onEditModal = (row) => {
    if (!CAN_UPDATE) return toast.show("Tu n'as pas le droit de modifier un deal.", "error");
    setEditingDeal({ ...row });
  };

  // Sauvegarde depuis le modal
  const saveEditedDeal = async () => {
    if (!editingDeal) return;
    
    try {
      const payload = {
        ...editingDeal,
        ca: Number(editingDeal.ca || 0),
        marge: Number(editingDeal.marge || 0),
        // S'assurer que dateCreation est au format yyyy-MM-dd
        dateCreation: toDateInputValue(editingDeal.dateCreation),
        dateDerniereModif: new Date().toISOString().slice(0, 10),
      };

      const saved = await api.put(`/deals/${editingDeal.id}`, payload);
      dispatch({ type: "UPDATE_DEAL", payload: saved || payload });
      toast.show("Deal mis à jour avec succès.", "success");
      setEditingDeal(null);
    } catch (err) {
      console.error("Erreur mise à jour deal:", err);
      toast.show(`Échec mise à jour : ${err.message}`, "error");
    }
  };

  const onDelete = async (id) => {
    if (!CAN_DELETE) return toast.show("Tu n'as pas le droit de supprimer un deal.", "error");
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

      {/* MODAL D'ÉDITION */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-3xl">
              <h3 className="text-xl font-bold">Modifier le deal</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Section 1 : Informations client */}
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-3">Informations client</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Projet <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingDeal.projet || ""}
                      onChange={(e) => setEditingDeal({ ...editingDeal, projet: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Client <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingDeal.client || ""}
                      onChange={(e) => setEditingDeal({ ...editingDeal, client: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Secteur <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingDeal.secteur || ""}
                      onChange={(e) => setEditingDeal({ ...editingDeal, secteur: e.target.value })}
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
                      Date de création <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={toDateInputValue(editingDeal.dateCreation)}
                      onChange={(e) => setEditingDeal({ ...editingDeal, dateCreation: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2 : Détails commerciaux */}
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-3">Détails commerciaux</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Type de deal <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingDeal.typeDeal || ""}
                      onChange={(e) => setEditingDeal({ ...editingDeal, typeDeal: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
                    >
                      <option value="">— Sélectionner —</option>
                      {TYPES_DEAL.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Commercial <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingDeal.commercial || ""}
                      onChange={(e) => setEditingDeal({ ...editingDeal, commercial: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
                    >
                      <option value="">— Sélectionner —</option>
                      {COMMERCIAUX.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Support AV
                    </label>
                    <select
                      value={editingDeal.supportAV || ""}
                      onChange={(e) => setEditingDeal({ ...editingDeal, supportAV: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
                    >
                      <option value="">— Sélectionner —</option>
                      {AV_SUPPORTS.map((av) => (
                        <option key={av} value={av}>{av}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Semestre <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingDeal.semestre || ""}
                      onChange={(e) => setEditingDeal({ ...editingDeal, semestre: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
                    >
                      <option value="">— Sélectionner —</option>
                      {SEMESTRES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Statut <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingDeal.statut || ""}
                      onChange={(e) => setEditingDeal({ ...editingDeal, statut: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
                    >
                      <option value="">— Sélectionner —</option>
                      {STATUTS.map((st) => (
                        <option key={st} value={st}>{st}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3 : Chiffres clés */}
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-3">Chiffres clés</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      CA (CFA)
                    </label>
                    <input
                      type="number"
                      value={editingDeal.ca || ""}
                      onChange={(e) => setEditingDeal({ ...editingDeal, ca: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Marge (CFA)
                    </label>
                    <input
                      type="number"
                      value={editingDeal.marge || ""}
                      onChange={(e) => setEditingDeal({ ...editingDeal, marge: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-2 pt-4 border-t border-black/10">
                <button
                  onClick={() => setEditingDeal(null)}
                  className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEditedDeal}
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