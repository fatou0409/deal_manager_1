// src/pages/visits/VisitsList.jsx - VERSION FINALE AVEC FILTRES + CORRECTION MANAGER
import { useEffect, useMemo, useState } from "react";
import DataTablePro from "../../components/DataTablePro";
import ImportExportBar from "../../components/ImportExportBar";
import { useAuth } from "../../auth/AuthProvider";
import { useStore } from "../../store/useStore";
import { Link } from "react-router-dom";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../lib/api";
import { SECTEURS, SEMESTRES, TYPES_VISITE } from "../../utils/constants";

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

export default function VisitsList() {
  const { state, dispatch } = useStore();
  const { can, user } = useAuth();
  const toast = useToast();

  const CAN_UPDATE = can("visit:update");
  const CAN_DELETE = can("visit:delete");
  const CAN_VIEW_ALL = user?.role === 'ADMIN' || user?.role === 'MANAGER'; // ✅ CORRIGÉ

  const [editingVisit, setEditingVisit] = useState(null);
  
  // ✅ États pour les filtres
  const [semestreFilter, setSemestreFilter] = useState(state.selectedSemestre);
  const [bdFilter, setBdFilter] = useState("all");
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
          console.warn("Erreur chargement BDs:", e.message);
        }
      })();
    }
  }, [CAN_VIEW_ALL]);

  // ✅ Charger les visites en fonction des filtres
  useEffect(() => {
    (async () => {
      try {
        // Construire les paramètres de l'URL
        const params = new URLSearchParams();
        if (semestreFilter) params.set('semestre', semestreFilter);
        if (CAN_VIEW_ALL && bdFilter !== 'all') {
          params.set('userId', bdFilter); // Le backend doit supporter ce filtre
        }

  const rows = await api(`/visits?${params.toString()}`);
        dispatch({ type: "SET_VISITS", payload: rows || [] });
      } catch (e) {
        console.warn("GET /visits failed:", e.message);
      }
    })();
  }, [dispatch, semestreFilter, bdFilter, CAN_VIEW_ALL]);

  // ✅ Filtrage des visites selon semestre + BD
  const filteredVisits = useMemo(() => {
    let visits = state.visits;

    // Filtre par semestre (avec support année)
    const semestres = getSemestresForFilter(semestreFilter);
    return state.visits.filter(v => semestres.includes(v.semestre));
  }, [state.visits, semestreFilter]);

  const onEdit = (row) => {
    if (!CAN_UPDATE) return toast.show("Tu n'as pas le droit de modifier une visite.", "error");
    setEditingVisit({ ...row });
  };

  const saveEditedVisit = async () => {
    if (!editingVisit) return;
    
    try {
      const payload = {
        ...editingVisit,
        date: toDateInputValue(editingVisit.date),
      };

  const saved = await api(`/visits/${editingVisit.id}`, { method: "PUT", body: payload });
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
      ...(CAN_VIEW_ALL ? [{
        key: "user",
        header: "Créé par",
        render: (r) => (
          <div className="text-xs">
            <div className="font-medium text-gray-900">
              {r.user?.name || "N/A"}
            </div>
            {r.user?.email && (
              <div className="text-gray-500 text-[10px]">
                {r.user.email}
              </div>
            )}
          </div>
        ),
      }] : []),
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
                    await api(`/visits/${r.id}`, { method: "DELETE" });
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
    [CAN_UPDATE, CAN_DELETE, CAN_VIEW_ALL, dispatch, toast]
  );

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
  const saved = await api("/visits", { method: "POST", body: v });
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Listes des visites</h2>
            <div className="flex items-center gap-3">
              <ImportExportBar
                resource="visit"
                title={`Visites — ${semestreFilter}`}
                filename={`Visites-${semestreFilter}`}
                columns={columns.filter(c => c.key && !c.key.startsWith("_"))}
                rows={filteredVisits}
                onImportRows={handleImportVisits}
              />
              <Link to="/visits/new" className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white px-3 py-1.5 border border-white/20 hover:bg-white/20 transition text-sm">
                + Nouvelle visite
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
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm text-gray-600">
          {filteredVisits.length} visite(s) trouvée(s)
        </div>
        <DataTablePro columns={columns} rows={filteredVisits} empty="Aucune visite" />
      </div>

      {/* MODAL D'ÉDITION */}
      {editingVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-3xl">
              <h3 className="text-xl font-bold">Modifier la visite</h3>
            </div>

            <div className="p-6 space-y-6">
              {CAN_VIEW_ALL && editingVisit.user && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <div>
                      <p className="text-xs font-semibold text-orange-900">Créé par</p>
                      <p className="text-sm text-orange-700">{editingVisit.user.name || editingVisit.user.email}</p>
                    </div>
                  </div>
                </div>
              )}

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
                      {SEMESTRES.filter(s => !s.includes("-Année")).map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

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