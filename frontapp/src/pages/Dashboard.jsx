// src/pages/Dashboard.jsx - VERSION FINALE : Chiffres complets + Unité dans en-tête + Dropdown BDs
import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { SEMESTRES } from "../utils/constants";
import Select from "../components/Select";
import DataTable from "../components/DataTable";
import { useAuth } from "../auth/AuthProvider";
import { useStore } from "../store/useStore";
import { api } from "../utils/api";

// Chart.js
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  BarElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
);

// ✅ Format nombre complet SANS abréviation (avec espaces pour lisibilité)
function fmtNumber(amount) {
  const num = Number(amount || 0);
  return num.toLocaleString('fr-FR'); // Ex: 1 143 000 000
}

// ✅ Format FCFA complet (pour tableaux et graphiques)
function fmtFCFA(amount) {
  const num = Number(amount || 0);
  return `${num.toLocaleString('fr-FR')} FCFA`; // Ex: 1 143 000 000 FCFA
}

function fmtInt(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat("fr-FR").format(Math.round(v));
}

function normalizeObjective(obj = {}) {
  return {
    ca: Number(obj.ca ?? 0),
    marge: Number(obj.marge ?? 0),
    visite: Number(obj.visites ?? obj.visite ?? 0),
    one2one: Number(obj.one2one ?? 0),
    workshop: Number(obj.workshops ?? obj.workshop ?? 0),
  };
}

const safeN = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

function isWonDeal(statut) {
  if (!statut) return false;
  const s = String(statut).toLowerCase().trim();
  return s.includes("gagn") || s === "won";
}

function isYearFilter(semestre) {
  return semestre?.includes("-Année");
}

function getSemestresForFilter(semestre) {
  if (isYearFilter(semestre)) {
    const year = semestre.split("-")[0];
    return [`${year}-S1`, `${year}-S2`];
  }
  return [semestre];
}

export default function Dashboard() {
  const { state, dispatch } = useStore();
  const { user, can } = useAuth();

  const [semestre, setSemestre] = useState(state.selectedSemestre);
  const [tab, setTab] = useState("table");
  const [loading, setLoading] = useState(true);
  
  const [businessDevelopers, setBusinessDevelopers] = useState([]);
  const [allObjectives, setAllObjectives] = useState({});
  
  // États pour le dropdown BDs
  const [selectedBDId, setSelectedBDId] = useState("");
  const [showBDDropdown, setShowBDDropdown] = useState(false);
  const [searchBD, setSearchBD] = useState("");

  const IS_ADMIN_OR_MANAGER = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const deals = await api.get(`/deals`);
        dispatch({ type: "SET_DEALS", payload: deals || [] });

        const visits = await api.get(`/visits`);
        dispatch({ type: "SET_VISITS", payload: visits || [] });

        try {
          const objectives = await api.get(`/objectives`);
          
          if (objectives && Array.isArray(objectives)) {
            const objectivesMap = {};
            objectives.forEach(obj => {
              const key = `${obj.userId}-${obj.period}`;
              objectivesMap[key] = normalizeObjective(obj);
            });
            setAllObjectives(objectivesMap);
            
            const objForCurrentUser = objectives.filter(o => o.userId === user?.id);
            const currentUserObjectives = {};
            objForCurrentUser.forEach(obj => {
              currentUserObjectives[obj.period] = normalizeObjective(obj);
            });
            dispatch({ type: "SET_OBJECTIVES", payload: currentUserObjectives });
          }
        } catch (objError) {
          console.warn("⚠️ Erreur chargement objectifs:", objError.message);
        }

        if (IS_ADMIN_OR_MANAGER) {
          try {
            const users = await api.get('/users');
            const bds = users.filter(u => u.role === 'BUSINESS_DEVELOPER');
            setBusinessDevelopers(bds);
          } catch (e) {
            console.warn("⚠️ Erreur chargement BDs:", e.message);
          }
        }

      } catch (e) {
        console.error("❌ Erreur chargement Dashboard:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [dispatch, user?.id, IS_ADMIN_OR_MANAGER]);

  const objectives = useMemo(() => {
    if (!IS_ADMIN_OR_MANAGER) {
      if (isYearFilter(semestre)) {
        const year = semestre.split("-")[0];
        const s1Obj = normalizeObjective(state.objectives[`${year}-S1`] || {});
        const s2Obj = normalizeObjective(state.objectives[`${year}-S2`] || {});
        return {
          ca: s1Obj.ca + s2Obj.ca,
          marge: s1Obj.marge + s2Obj.marge,
          visite: s1Obj.visite + s2Obj.visite,
          one2one: s1Obj.one2one + s2Obj.one2one,
          workshop: s1Obj.workshop + s2Obj.workshop,
        };
      }
      return normalizeObjective(state.objectives[semestre] || {});
    }
    
    let totalObj = { ca: 0, marge: 0, visite: 0, one2one: 0, workshop: 0 };
    const semestres = getSemestresForFilter(semestre);
    
    businessDevelopers.forEach(bd => {
      semestres.forEach(sem => {
        const key = `${bd.id}-${sem}`;
        const bdObj = normalizeObjective(allObjectives[key] || {});
        totalObj.ca += bdObj.ca;
        totalObj.marge += bdObj.marge;
        totalObj.visite += bdObj.visite;
        totalObj.one2one += bdObj.one2one;
        totalObj.workshop += bdObj.workshop;
      });
    });
    
    return totalObj;
  }, [state.objectives, semestre, IS_ADMIN_OR_MANAGER, businessDevelopers, allObjectives]);

  const dealsS = useMemo(() => {
    const semestres = getSemestresForFilter(semestre);
    return state.deals.filter((d) => semestres.includes(d.semestre));
  }, [state.deals, semestre]);

  const visitsS = useMemo(() => {
    const semestres = getSemestresForFilter(semestre);
    return state.visits.filter((v) => semestres.includes(v.semestre));
  }, [state.visits, semestre]);

  const dealsWon = useMemo(() => {
    return dealsS.filter((d) => isWonDeal(d.statut));
  }, [dealsS]);

  const sums = useMemo(() => {
    const ca = dealsWon.reduce((acc, d) => acc + safeN(d.ca), 0);
    const marge = dealsWon.reduce((acc, d) => acc + safeN(d.marge), 0);
    const nVisite = visitsS.filter((v) => v.type === "Visite").length;
    const nOne = visitsS.filter((v) => v.type === "One-to-One").length;
    const nWorkshop = visitsS.filter((v) => v.type === "Workshop").length;
    const byStatus = groupByStatus(dealsS);

    return { ca, marge, nVisite, nOne, nWorkshop, byStatus };
  }, [dealsWon, visitsS, dealsS]);

  // Calcul performance du BD sélectionné
  const selectedBDPerformance = useMemo(() => {
    if (!selectedBDId) return null;
    
    const bd = businessDevelopers.find(b => b.id === selectedBDId);
    if (!bd) return null;
    
    const semestres = getSemestresForFilter(semestre);
    const bdDeals = dealsS.filter(d => d.ownerId === bd.id);
    const bdVisits = visitsS.filter(v => v.userId === bd.id);
    const bdDealsWon = bdDeals.filter(d => isWonDeal(d.statut));
    
    const realized = {
      ca: bdDealsWon.reduce((acc, d) => acc + safeN(d.ca), 0),
      marge: bdDealsWon.reduce((acc, d) => acc + safeN(d.marge), 0),
      visite: bdVisits.filter(v => v.type === "Visite").length,
      one2one: bdVisits.filter(v => v.type === "One-to-One").length,
      workshop: bdVisits.filter(v => v.type === "Workshop").length,
    };
    
    let bdObjectives = { ca: 0, marge: 0, visite: 0, one2one: 0, workshop: 0 };
    semestres.forEach(sem => {
      const key = `${bd.id}-${sem}`;
      const obj = normalizeObjective(allObjectives[key] || {});
      bdObjectives.ca += obj.ca;
      bdObjectives.marge += obj.marge;
      bdObjectives.visite += obj.visite;
      bdObjectives.one2one += obj.one2one;
      bdObjectives.workshop += obj.workshop;
    });
    
    return { bd, objectives: bdObjectives, realized };
  }, [selectedBDId, businessDevelopers, semestre, dealsS, visitsS, allObjectives]);

  // BDs filtrés par recherche
  const filteredBDs = useMemo(() => {
    if (!searchBD.trim()) return businessDevelopers;
    const search = searchBD.toLowerCase();
    return businessDevelopers.filter(bd => 
      bd.name?.toLowerCase().includes(search) || 
      bd.email?.toLowerCase().includes(search)
    );
  }, [businessDevelopers, searchBD]);

  const hasAnyData = dealsS.length > 0 || visitsS.length > 0;

  const pct = (num, den) => {
    const d = Number(den || 0);
    const n = Number(num || 0);
    if (!d) return "0%";
    return `${Math.round((n / d) * 100)}%`;
  };

  const tableRows = [
    { id: "visite",   semestre, type: "Visite",             nbre: sums.nVisite,   objectif: objectives.visite,   taux: pct(sums.nVisite, objectives.visite) },
    { id: "workshop", semestre, type: "Workshop",           nbre: sums.nWorkshop, objectif: objectives.workshop, taux: pct(sums.nWorkshop, objectives.workshop) },
    { id: "one",      semestre, type: "One-2-One",          nbre: sums.nOne,      objectif: objectives.one2one,  taux: pct(sums.nOne, objectives.one2one) },
    { id: "ca",       semestre, type: "Chiffre d'affaires", nbre: sums.ca,        objectif: objectives.ca,       taux: pct(sums.ca, objectives.ca), isMoney: true },
    { id: "marge",    semestre, type: "Marge",              nbre: sums.marge,     objectif: objectives.marge,    taux: pct(sums.marge, objectives.marge), isMoney: true },
  ];

  const columns = [
    { key: "semestre", header: "Semestre" },
    { key: "type", header: "Type" },
    { key: "nbre", header: "Nbre", render: (r) => (r.isMoney ? fmtFCFA(r.nbre) : r.nbre) },
    { key: "objectif", header: "Objectif / Semestre", render: (r) => (r.isMoney ? fmtFCFA(r.objectif) : r.objectif) },
    { key: "taux", header: "Taux" },
  ];

  const barData = {
    labels: ["CA", "Marge"],
    datasets: [
      {
        label: "Réalisé",
        data: [sums.ca, sums.marge],
        backgroundColor: "rgba(249,115,22,0.85)",
      },
      {
        label: "Objectif",
        data: [objectives.ca || 0, objectives.marge || 0],
        backgroundColor: "rgba(203,213,225,0.85)",
      },
    ],
  };
  
  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${fmtFCFA(ctx.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: { callback: (value) => fmtFCFA(value) },
      },
    },
  };

  const donutLabels = Object.keys(sums.byStatus);
  const donutData = {
    labels: donutLabels,
    datasets: [
      {
        data: donutLabels.map((k) => sums.byStatus[k]),
        backgroundColor: [
          "rgba(34,197,94,0.85)",
          "rgba(250,204,21,0.85)",
          "rgba(239,68,68,0.85)",
          "rgba(99,102,241,0.85)",
          "rgba(148,163,184,0.85)",
        ],
        borderWidth: 0,
      },
    ],
  };
  
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" } },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO / HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white shadow-2xl">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
        />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Tableau de bord</h2>
              <p className="mt-1 text-white/80 text-sm">
                {user?.role === 'BUSINESS_DEVELOPER' 
                  ? '📊 Vos statistiques personnelles' 
                  : '📈 Vue globale des performances'}
              </p>
            </div>
            <div className="w-full md:w-64">
              <Select
                value={semestre}
                onChange={(v) => { setSemestre(v); dispatch({ type: "SET_SEMESTRE", payload: v }); }}
                options={SEMESTRES}
                className="bg-white text-black border-white/40"
              />
            </div>
          </div>

          {user?.role !== 'BUSINESS_DEVELOPER' && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                { label: "CA (FCFA)", value: fmtNumber(objectives.ca) },
                { label: "Marge (FCFA)", value: fmtNumber(objectives.marge) },
                { label: "Visites", value: objectives.visite ?? 0 },
                { label: "One-2-One", value: objectives.one2one ?? 0 },
                { label: "Workshops", value: objectives.workshop ?? 0 },
              ].map((x, i) => (
                <div
                  key={x.label}
                  className="rounded-xl border border-white/20 bg-white/20 p-3 shadow-lg transition-transform duration-300 hover:translate-y-0.5 select-none"
                  style={{ animationDelay: `${i * 0.06 + 0.06}s` }}
                >
                  <div className="text-xs text-white/85">{x.label}</div>
                  <div className="text-xl font-semibold whitespace-nowrap overflow-hidden text-ellipsis" title={String(x.value)}>
                    {x.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {can("objectives:update") && user?.role !== 'BUSINESS_DEVELOPER' && (
            <div className="mt-3">
              <Link
                to="/objectives/new"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 border border-white/20 hover:bg-orange-50 transition text-sm"
              >
                Gérer les objectifs
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 18l6-6-6-6" strokeWidth="2" />
                </svg>
              </Link>
            </div>
          )}
          
          {user?.role === 'BUSINESS_DEVELOPER' && (
            <div className="mt-3 text-white/70 text-sm">
              💡 Vos objectifs sont définis par votre manager
            </div>
          )}
        </div>
      </div>

      {/* PERFORMANCES GLOBALES */}
      {IS_ADMIN_OR_MANAGER && (
        <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-white p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Performances Globales — {semestre}</h3>
              <p className="text-sm text-gray-600">Cumul de tous les Business Developers</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "CA TOTAL (FCFA)", objectif: objectives.ca, realise: sums.ca },
              { label: "MARGE TOTALE (FCFA)", objectif: objectives.marge, realise: sums.marge },
              { label: "VISITES TOTALES", objectif: objectives.visite, realise: sums.nVisite, isNumber: true },
              { label: "ONE-TO-ONE TOTAL", objectif: objectives.one2one, realise: sums.nOne, isNumber: true },
              { label: "WORKSHOPS TOTAL", objectif: objectives.workshop, realise: sums.nWorkshop, isNumber: true },
            ].map((metric) => (
              <div key={metric.label} className="bg-white rounded-xl p-4 border border-green-100 shadow-sm">
                <div className="text-xs font-semibold text-gray-500 uppercase mb-2">{metric.label}</div>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {metric.isNumber ? metric.objectif : fmtNumber(metric.objectif)}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  Réalisé: {metric.isNumber ? metric.realise : fmtNumber(metric.realise)}
                </div>
                <div className={`text-sm font-bold ${Number(pct(metric.realise, metric.objectif).replace('%', '')) >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {pct(metric.realise, metric.objectif)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PERFORMANCES INDIVIDUELLES AVEC DROPDOWN */}
      {IS_ADMIN_OR_MANAGER && (
        <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">Performances Individuelles — {semestre}</h3>
              <p className="text-sm text-gray-600">Sélectionnez un Business Developer</p>
            </div>
          </div>
          
          {/* DROPDOWN SÉLECTION BD */}
          <div className="mb-6 relative">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Choisir un Business Developer
            </label>
            
            <div className="relative">
              <button
                onClick={() => setShowBDDropdown(!showBDDropdown)}
                className="w-full md:w-96 flex items-center justify-between rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none hover:border-blue-300 transition"
              >
                <span className={selectedBDId ? "text-gray-900" : "text-gray-400"}>
                  {selectedBDId 
                    ? businessDevelopers.find(bd => bd.id === selectedBDId)?.name || 
                      businessDevelopers.find(bd => bd.id === selectedBDId)?.email
                    : "Sélectionner un BD..."}
                </span>
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform ${showBDDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {showBDDropdown && (
                <div className="absolute z-10 mt-2 w-full md:w-96 bg-white rounded-xl border border-blue-200 shadow-xl max-h-80 overflow-hidden">
                  {/* Barre de recherche */}
                  <div className="p-3 border-b border-gray-200">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="🔍 Rechercher..."
                        value={searchBD}
                        onChange={(e) => setSearchBD(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        autoFocus
                      />
                      <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8"/>
                        <path d="m21 21-4.35-4.35"/>
                      </svg>
                    </div>
                  </div>

                  {/* Liste des BDs */}
                  <div className="max-h-60 overflow-y-auto">
                    {/* Option "Aucun" */}
                    <button
                      onClick={() => {
                        setSelectedBDId("");
                        setShowBDDropdown(false);
                        setSearchBD("");
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition ${
                        !selectedBDId ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span className="text-gray-400">Aucun BD sélectionné</span>
                    </button>

                    {filteredBDs.map(bd => (
                      <button
                        key={bd.id}
                        onClick={() => {
                          setSelectedBDId(bd.id);
                          setShowBDDropdown(false);
                          setSearchBD("");
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition ${
                          selectedBDId === bd.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-blue-600 font-bold text-xs">
                              {bd.name?.charAt(0)?.toUpperCase() || bd.email?.charAt(0)?.toUpperCase() || '?'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{bd.name || bd.email}</div>
                            {bd.name && <div className="text-xs text-gray-500 truncate">{bd.email}</div>}
                          </div>
                          {selectedBDId === bd.id && (
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}

                    {filteredBDs.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-gray-500">
                        Aucun BD trouvé
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AFFICHAGE PERFORMANCE DU BD SÉLECTIONNÉ */}
          {selectedBDPerformance ? (
            <div className="bg-white rounded-xl p-5 border border-blue-100 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">
                    {selectedBDPerformance.bd.name?.charAt(0)?.toUpperCase() || 
                     selectedBDPerformance.bd.email?.charAt(0)?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-lg text-gray-900">
                    {selectedBDPerformance.bd.name || selectedBDPerformance.bd.email}
                  </h4>
                  <p className="text-xs text-gray-500">{selectedBDPerformance.bd.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "CA (FCFA)", objectif: selectedBDPerformance.objectives.ca, realise: selectedBDPerformance.realized.ca, isMoney: true },
                  { label: "MARGE (FCFA)", objectif: selectedBDPerformance.objectives.marge, realise: selectedBDPerformance.realized.marge, isMoney: true },
                  { label: "VISITES", objectif: selectedBDPerformance.objectives.visite, realise: selectedBDPerformance.realized.visite },
                  { label: "ONE-TO-ONE", objectif: selectedBDPerformance.objectives.one2one, realise: selectedBDPerformance.realized.one2one },
                  { label: "WORKSHOPS", objectif: selectedBDPerformance.objectives.workshop, realise: selectedBDPerformance.realized.workshop },
                ].map((metric) => (
                  <div key={metric.label} className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{metric.label}</div>
                    <div className="text-lg font-bold text-gray-900">
                      {metric.isMoney ? fmtNumber(metric.objectif) : metric.objectif}
                    </div>
                    <div className="text-xs text-gray-500">
                      Réal: {metric.isMoney ? fmtNumber(metric.realise) : metric.realise}
                    </div>
                    <div className={`text-xs font-bold ${Number(pct(metric.realise, metric.objectif).replace('%', '')) >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                      {pct(metric.realise, metric.objectif)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 border border-blue-100 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <p className="text-gray-500 text-sm">
                Sélectionnez un Business Developer pour voir ses performances
              </p>
            </div>
          )}
        </div>
      )}

      {/* SECTION "Mes Objectifs" - BD uniquement */}
      {user?.role === 'BUSINESS_DEVELOPER' && (
        <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="12" cy="12" r="8"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Mes Objectifs — {semestre}</h3>
              <p className="text-sm text-gray-600">Définis par votre manager</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: "CA (FCFA)", icon: "M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6", objectif: objectives.ca, realise: sums.ca, isMoney: true },
              { label: "MARGE (FCFA)", icon: "M3 3v18h18M19 9l-5 5-4-4-3 3", objectif: objectives.marge, realise: sums.marge, isMoney: true },
              { label: "VISITES", icon: "M3 4h18v18H3z M16 2v4M8 2v4M3 10h18", objectif: objectives.visite, realise: sums.nVisite },
              { label: "ONE-TO-ONE", icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", objectif: objectives.one2one, realise: sums.nOne },
              { label: "WORKSHOPS", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75", objectif: objectives.workshop, realise: sums.nWorkshop },
            ].map((metric) => (
              <div key={metric.label} className="bg-white rounded-xl p-4 border border-orange-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d={metric.icon}/>
                  </svg>
                  <div className="text-xs font-semibold text-gray-500 uppercase">{metric.label}</div>
                </div>
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {metric.isMoney ? fmtNumber(metric.objectif) : metric.objectif}
                </div>
                <div className="text-xs text-gray-500 mb-1">
                  Réalisé: {metric.isMoney ? fmtNumber(metric.realise) : metric.realise}
                </div>
                <div className={`text-sm font-bold ${Number(pct(metric.realise, metric.objectif).replace('%', '')) >= 100 ? 'text-green-600' : 'text-orange-600'}`}>
                  {pct(metric.realise, metric.objectif)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onglets */}
      <div className="flex flex-wrap gap-2 mt-2">
        {[
          { id: "table", label: "Tableau" },
          { id: "charts", label: "Graphiques" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`px-3 py-1.5 rounded-full border text-sm transition-all duration-200 focus:ring-2 focus:ring-orange-400 focus:outline-none ${
              tab === t.id
                ? "bg-orange-600 text-white border-orange-600 shadow"
                : "bg-white text-black border-black/10 hover:bg-orange-50 hover:scale-105"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      
      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>

      {/* Vues */}
      {tab === "table" && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-black">Tableau de suivi</h3>
          <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
            {!hasAnyData ? (
              <div className="p-4 text-sm text-black/60">
                Aucune donnée pour {semestre}. Commence par créer un{" "}
                <Link to="/deals/new" className="underline">deal</Link> ou une{" "}
                <Link to="/visits/new" className="underline">visite</Link>.
              </div>
            ) : (
              <DataTable columns={columns} rows={tableRows} />
            )}
          </div>
        </div>
      )}

      {tab === "charts" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">CA & Marge — {semestre} (réalisé vs objectif)</div>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
            <div className="mt-2 text-xs text-black/60">
              CA : {fmtFCFA(sums.ca)} / {fmtFCFA(objectives.ca)} — {pct(sums.ca, objectives.ca)} &nbsp;|&nbsp; Marge : {fmtFCFA(sums.marge)} / {fmtFCFA(objectives.marge)} — {pct(sums.marge, objectives.marge)}
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">Répartition des statuts — {semestre}</div>
            <div className="h-64">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm xl:col-span-3">
            <div className="text-sm font-semibold mb-2">Activité de visites — {semestre} (réalisé vs objectif)</div>
            <div className="h-64">
              <Bar data={visitsBarData(objectives, sums)} options={visitsBarOptions} />
            </div>
            <div className="mt-2 text-xs text-black/60">
              Visites : {sums.nVisite}/{objectives.visite || 0} &nbsp;|&nbsp; One-to-One : {sums.nOne}/{objectives.one2one || 0} &nbsp;|&nbsp; Workshops : {sums.nWorkshop}/{objectives.workshop || 0}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function groupByStatus(deals = []) {
  const acc = {};
  for (const d of deals) {
    const s = (d.statut || "—").trim();
    acc[s] = (acc[s] || 0) + 1;
  }
  return acc;
}

function visitsBarData(objectives, sums) {
  const labels = ["Visites", "One-to-One", "Workshops"];
  return {
    labels,
    datasets: [
      {
        label: "Réalisé",
        data: [sums.nVisite, sums.nOne, sums.nWorkshop],
        backgroundColor: "rgba(249,115,22,0.85)",
      },
      {
        label: "Objectif",
        data: [objectives.visite || 0, objectives.one2one || 0, objectives.workshop || 0],
        backgroundColor: "rgba(203,213,225,0.85)",
      },
    ],
  };
}

const visitsBarOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: "top" }, tooltip: { enabled: true } },
  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
};