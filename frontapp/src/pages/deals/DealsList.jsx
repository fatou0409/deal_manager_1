// src/pages/deals/DealsList.jsx - VERSION FINALE AVEC FILTRES + CORRECTION MANAGER
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

// ✅ Helper pour déterminer si c'est une année complète
function isYearFilter(semestre) {
  return semestre?.includes("-Année");
}

// ✅ Helper pour obtenir les semestres à filtrer
function getSemestresForFilter(semestre) {
  if (isYearFilter(semestre)) {
    const year = semestre.split("-")[0];
    return [`${year}-S1`, `${year}-S2`];
  }
  return [semestre];
}

export default function DealsList() {
  const { state, dispatch } = useStore();
  const { can, user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const CAN_UPDATE = can("deal:update");
  const CAN_DELETE = can("deal:delete");
  const CAN_VIEW_ALL = user?.role === 'ADMIN' || user?.role === 'MANAGER'; // ✅ CORRIGÉ

  const [editingDeal, setEditingDeal] = useState(null);
  
  // ✅ États pour les filtres
  const [semestreFilter, setSemestreFilter] = useState(state.selectedSemestre);
  const [bdFilter, setBdFilter] = useState("all"); // "all" ou userId
  const [businessDevelopers, setBusinessDevelopers] = useState([]);

  const toDateInputValue = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return "";
    }
  };

  // ✅ Charger la liste des BDs (uniquement pour Admin/Manager)
  useEffect(() => {
    if (CAN_VIEW_ALL) {
      (async () => {
        try {
          const users = await api('/users');
          const bds = users.filter(u => u.role === 'BUSINESS_DEVELOPER');
          setBusinessDevelopers(bds);
        } catch (e) {
          // Erreur non bloquante
        }
      })();
    }
  }, [CAN_VIEW_ALL]);

  // ✅ Charger les deals en fonction des filtres
  useEffect(() => {
    (async () => {
        try {
        // Construire les paramètres de l'URL
        const params = new URLSearchParams();
        if (semestreFilter) params.set('semestre', semestreFilter);
        if (CAN_VIEW_ALL && bdFilter !== 'all') {
          params.set('ownerId', bdFilter); // Le backend doit supporter ce filtre
        }

  const rows = await api(`/deals?${params.toString()}`);
        dispatch({ type: "SET_DEALS", payload: rows || [] });
      } catch (e) {
        toast.show(`Erreur chargement deals: ${e.message}`, "error");
      }
    })();
  }, [dispatch, semestreFilter, bdFilter, CAN_VIEW_ALL]);

  // ✅ Filtrage des deals selon semestre + BD
  const filteredDeals = useMemo(() => {
    let deals = state.deals;

    // Filtre par semestre (avec support année)
    const semestres = getSemestresForFilter(semestreFilter);
    return state.deals.filter(d => semestres.includes(d.semestre));
  }, [state.deals, semestreFilter]);

  const onEditModal = (row) => {
    if (!CAN_UPDATE) return toast.show("Tu n'as pas le droit de modifier un deal.", "error");
    setEditingDeal({ ...row });
  };

  const saveEditedDeal = async () => {
    if (!editingDeal) return;
    
    try {
      const payload = {
        ...editingDeal,
        ca: Number(editingDeal.ca || 0),
        marge: Number(editingDeal.marge || 0),
        dateCreation: toDateInputValue(editingDeal.dateCreation),
        dateDerniereModif: new Date().toISOString().slice(0, 10),
      };

  const saved = await api(`/deals/${editingDeal.id}`, { method: "PUT", body: payload });
      dispatch({ type: "UPDATE_DEAL", payload: saved || payload });
      toast.show("Deal mis à jour avec succès.", "success");
      setEditingDeal(null);
    } catch (err) {
      toast.show(`Échec mise à jour : ${err.message}`, "error");
    }
  };

  const onDelete = async (id) => {
    if (!CAN_DELETE) return toast.show("Tu n'as pas le droit de supprimer un deal.", "error");
    if (!confirm("Supprimer ce deal ?")) return;
    try {
  await api(`/deals/${id}`, { method: "DELETE" });
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
        render: (r) => fmtFCFA(r.ca || 0),
      },
      {
        key: "marge",
        header: "Marge",
        render: (r) => fmtFCFA(r.marge || 0),
      },
      { key: "statut", header: "Statut" },
      ...(CAN_VIEW_ALL ? [{
        key: "owner",
        header: "Créé par",
        render: (r) => (
          <div className="text-xs">
            <div className="font-medium text-gray-900">
              {r.owner?.name || "N/A"}
            </div>
            {r.owner?.email && (
              <div className="text-gray-500 text-[10px]">
                {r.owner.email}
              </div>
            )}
          </div>
        ),
      }] : []),
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
    [CAN_UPDATE, CAN_DELETE, CAN_VIEW_ALL]
  );

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
        const saved = await api("/deals", { method: "POST", body: d });
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
              Liste des Deals
            </h2>

            <div className="flex items-center gap-3">
              <ImportExportBar
                resource="deal"
                title={`Deals — ${semestreFilter}`}
                filename={`Deals-${semestreFilter}`}
                columns={columns.filter(c => c.key && !c.key.startsWith("_"))}
                rows={filteredDeals}
                onImportRows={handleImportDeals}
              />
              <Link to="/deals/new" className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white px-3 py-1.5 border border-white/20 hover:bg-white/20 transition text-sm">
                + Nouveau deal
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ SECTION FILTRES */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Filtre Semestre */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Semestre
            </label>
            <select
              value={semestreFilter}
              onChange={(e) => setSemestreFilter(e.target.value)}
              className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
            >
              {SEMESTRES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Filtre BD (uniquement pour Admin/Manager) */}
          {CAN_VIEW_ALL && (
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                Business Developer
              </label>
              <select
                value={bdFilter}
                onChange={(e) => setBdFilter(e.target.value)}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none bg-white"
              >
                <option value="all">Tous les BDs</option>
                {businessDevelopers.map((bd) => (
                  <option key={bd.id} value={bd.id}>
                    {bd.name || bd.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Bouton Réinitialiser */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSemestreFilter(state.selectedSemestre);
                setBdFilter("all");
              }}
              className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-100 transition"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Indicateur de filtre actif */}
        <div className="mt-3 flex flex-wrap gap-2">
          {semestreFilter !== state.selectedSemestre && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
              Semestre: {semestreFilter}
            </span>
          )}
          {CAN_VIEW_ALL && bdFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
              BD: {businessDevelopers.find(bd => bd.id === bdFilter)?.name || "Sélectionné"}
            </span>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm overflow-x-auto">
        <div className="mb-3 text-sm text-gray-600">
          {filteredDeals.length} deal(s) trouvé(s)
        </div>
        <DataTablePro columns={columns} rows={filteredDeals} />
      </div>

      {/* MODAL D'ÉDITION */}
      {editingDeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-3xl">
              <h3 className="text-xl font-bold">Modifier le deal</h3>
            </div>

            <div className="p-6 space-y-6">
              {CAN_VIEW_ALL && editingDeal.owner && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-orange-900">Créé par</p>
                      <p className="text-sm text-orange-700">{editingDeal.owner.name || editingDeal.owner.email}</p>
                    </div>
                  </div>
                </div>
              )}

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
                      {SEMESTRES.filter(s => !s.includes("-Année")).map((s) => (
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
