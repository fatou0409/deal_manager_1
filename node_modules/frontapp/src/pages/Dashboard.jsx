// src/pages/Dashboard.jsx
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SEMESTRES } from "../utils/constants";
import { fmtFCFA } from "../utils/format";
import Select from "../components/Select";
import DataTable from "../components/DataTable";
import { useAuth } from "../auth/AuthProvider";
import { useStore } from "../store/useStore";

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

// Enregistrement global Chart.js
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

// ✅ normalise les objectifs quelle que soit la clé (visite/visites, workshop/workshops)
function normalizeObjective(obj = {}) {
  return {
    ca: Number(obj.ca ?? 0),
    marge: Number(obj.marge ?? 0),
    visite: Number(obj.visites ?? obj.visite ?? 0),
    one2one: Number(obj.one2one ?? 0),
    workshop: Number(obj.workshops ?? obj.workshop ?? 0),
  };
}

// ✅ format entier FR sans unité (pour les cartes du bandeau)
function fmtInt(n) {
  const v = Number(n || 0);
  return new Intl.NumberFormat("fr-FR").format(Math.round(v));
}

// ✅ garde anti-NaN
const safeN = (n) => {
  const v = Number(n);
  return Number.isFinite(v) ? v : 0;
};

export default function Dashboard() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();

  const [semestre, setSemestre] = useState(state.selectedSemestre);
  const [tab, setTab] = useState("table"); // "table" | "secteur" | "commercial" | "charts"

  // utilise la normalisation
  const objectives = normalizeObjective(state.objectives[semestre] || {});

  // Filtrage par semestre
  const dealsS = useMemo(
    () => state.deals.filter((d) => d.semestre === semestre),
    [state.deals, semestre]
  );
  const visitsS = useMemo(
    () => state.visits.filter((v) => v.semestre === semestre),
    [state.visits, semestre]
  );

  // Pour CA/Marge, on ne comptabilise que les deals "gagnés" (blind côté front)
  const dealsWon = useMemo(
    () => dealsS.filter((d) => (d.statut || "").toLowerCase().startsWith("gagn")),
    [dealsS]
  );

  // Agrégats du semestre
  const sums = useMemo(() => {
    const ca = dealsWon.reduce((acc, d) => acc + safeN(d.ca), 0);
    const marge = dealsWon.reduce((acc, d) => acc + safeN(d.marge), 0);
    const nVisite = visitsS.filter((v) => v.type === "Visite").length;
    const nOne = visitsS.filter((v) => v.type === "One-to-One").length;
    const nWorkshop = visitsS.filter((v) => v.type === "Workshop").length;
    const byStatus = groupByStatus(dealsS);
    return { ca, marge, nVisite, nOne, nWorkshop, byStatus };
  }, [dealsWon, visitsS, dealsS]);

  const hasAnyData = dealsS.length > 0 || visitsS.length > 0;

  const pct = (num, den) => {
    const d = Number(den || 0);
    const n = Number(num || 0);
    if (!d) return "0%";
    return `${Math.round((n / d) * 100)}%`;
  };

  // ====== Tableau de suivi (avec colonne Semestre) ======
  const tableRows = [
    { id: "visite",   semestre, type: "Visite",             nbre: sums.nVisite,   objectif: objectives.visite,   taux: pct(sums.nVisite, objectives.visite) },
    { id: "workshop", semestre, type: "Workshop",           nbre: sums.nWorkshop, objectif: objectives.workshop, taux: pct(sums.nWorkshop, objectives.workshop) },
    { id: "one",      semestre, type: "One-2-One",          nbre: sums.nOne,      objectif: objectives.one2one,  taux: pct(sums.nOne, objectives.one2one) },
    { id: "ca",       semestre, type: "Chiffre d’affaires", nbre: sums.ca,        objectif: objectives.ca,       taux: pct(sums.ca, objectives.ca), isMoney: true },
    { id: "marge",    semestre, type: "Marge",              nbre: sums.marge,     objectif: objectives.marge,    taux: pct(sums.marge, objectives.marge), isMoney: true },
  ];

  const columns = [
    { key: "semestre", header: "Semestre" },
    { key: "type", header: "Type" },
    { key: "nbre", header: "Nbre", render: (r) => (r.isMoney ? fmtFCFA(r.nbre) : r.nbre) },
    { key: "objectif", header: "Objectif / Semestre", render: (r) => (r.isMoney ? fmtFCFA(r.objectif) : r.objectif) },
    { key: "taux", header: "Taux" },
  ];

  // ====== Pivots ======
  const pivotBy = (key) => {
    const group = {};
    for (const d of dealsS) {
      const k = d[key] || "—";
      if (!group[k]) group[k] = { ca: 0, marge: 0, deals: 0 };
      group[k].ca += safeN(d.ca);
      group[k].marge += safeN(d.marge);
      group[k].deals += 1;
    }
    for (const v of visitsS) {
      const k = key === "secteur" ? (v.secteur || "—") : "—";
      if (!group[k]) group[k] = { ca: 0, marge: 0, deals: 0 };
      group[k].visite = (group[k].visite || 0) + (v.type === "Visite" ? 1 : 0);
      group[k].one = (group[k].one || 0) + (v.type === "One-to-One" ? 1 : 0);
      group[k].workshop = (group[k].workshop || 0) + (v.type === "Workshop" ? 1 : 0);
    }
    return Object.entries(group).map(([name, agg]) => ({
      id: name,
      name,
      deals: agg.deals || 0,
      ca: agg.ca || 0,
      marge: agg.marge || 0,
      visite: agg.visite || 0,
      one: agg.one || 0,
      workshop: agg.workshop || 0,
    }));
  };

  const bySecteur = useMemo(() => pivotBy("secteur"), [dealsS, visitsS]);
  const byCommercial = useMemo(() => pivotBy("commercial"), [dealsS, visitsS]);

  const pivotCols = [
    { key: "name", header: tab === "secteur" ? "Secteur" : "Commercial" },
    { key: "deals", header: "Deals" },
    { key: "ca", header: "CA", render: (r) => fmtFCFA(r.ca) },
    { key: "marge", header: "Marge", render: (r) => fmtFCFA(r.marge) },
    { key: "visite", header: "Visites" },
    { key: "one", header: "One-2-One" },
    { key: "workshop", header: "Workshops" },
  ];

  // ====== Données Chart.js ======
  // 1) Bar: CA & Marge — réalisé vs objectif
  const barData = {
    labels: ["CA", "Marge"],
    datasets: [
      {
        label: "Réalisé",
        data: [sums.ca, sums.marge],
        backgroundColor: "rgba(249,115,22,0.85)", // orange
      },
      {
        label: "Objectif",
        data: [objectives.ca || 0, objectives.marge || 0],
        backgroundColor: "rgba(203,213,225,0.85)", // slate-300
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

  // 2) Bar comparatif: Activité de visites (Réalisé vs Objectif) par type
  const visitsBarLabels = ["Visites", "One-to-One", "Workshops"];
  const visitsBarData = {
    labels: visitsBarLabels,
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
  const visitsBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top" },
      tooltip: { enabled: true },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { precision: 0 },
      },
    },
  };

  // 3) Donut: répartition des statuts de deals du semestre
  const donutLabels = Object.keys(sums.byStatus);
  const donutData = {
    labels: donutLabels,
    datasets: [
      {
        data: donutLabels.map((k) => sums.byStatus[k]),
        backgroundColor: [
          "rgba(34,197,94,0.85)",  // gagné
          "rgba(250,204,21,0.85)", // en cours
          "rgba(239,68,68,0.85)",  // perdu
          "rgba(99,102,241,0.85)", // autre
          "rgba(148,163,184,0.85)",// défaut
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO / HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white shadow-2xl">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
        />
        {/* voile léger sans flou */}
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
              <p className="mt-1 text-white/80 text-sm">Suivi des objectifs semestriels</p>
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

          {/* Bandeau objectifs (lecture) + CTA vers page d’édition */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { label: "CA (CFA)", value: fmtInt(objectives.ca) },
              { label: "Marge (CFA)", value: fmtInt(objectives.marge) },
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
                <div
                  className="text-xl font-semibold whitespace-nowrap overflow-hidden text-ellipsis"
                  title={String(x.value)}
                >
                  {x.value}
                </div>
              </div>
            ))}
          </div>

          {can("objectives:update") && (
            <div className="mt-3">
              <Link
                to="/objectives/edit"
                className="inline-flex items-center gap-2 rounded-xl bg-white text-black px-4 py-2 border border-white/20 hover:bg-orange-50 transition text-sm"
              >
                Gérer les objectifs
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 18l6-6-6-6" strokeWidth="2" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Onglets */}
      <div className="flex flex-wrap gap-2 mt-2">
        {[
          { id: "table", label: "Tableau" },
          { id: "secteur", label: "Par secteur" },
          { id: "commercial", label: "Par commercial" },
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
                Aucune donnée pour {semestre}. Commence par créer un <Link to="/deals/new" className="underline">deal</Link> ou une <Link to="/visits/new" className="underline">visite</Link>.
              </div>
            ) : (
              <DataTable columns={columns} rows={tableRows} />
            )}
          </div>
        </div>
      )}

      {tab === "secteur" && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-black">Suivi par secteur</h3>
          <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
            {bySecteur.length === 0 ? (
              <div className="p-4 text-sm text-black/60">Aucune donnée</div>
            ) : (
              <DataTable columns={pivotCols} rows={bySecteur} empty="Aucune donnée" />
            )}
          </div>
        </div>
      )}

      {tab === "commercial" && (
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-black">Suivi par commercial</h3>
          <div className="rounded-2xl border border-black/10 bg-white shadow-sm">
            {byCommercial.length === 0 ? (
              <div className="p-4 text-sm text-black/60">Aucune donnée</div>
            ) : (
              <DataTable columns={pivotCols} rows={byCommercial} empty="Aucune donnée" />
            )}
          </div>
        </div>
      )}

      {tab === "charts" && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Bar: CA/Marge vs Objectif */}
          <div className="xl:col-span-2 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">CA & Marge — {semestre} (réalisé vs objectif)</div>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
            <div className="mt-2 text-xs text-black/60">
              CA : {fmtFCFA(sums.ca)} / {fmtFCFA(objectives.ca)} — {pct(sums.ca, objectives.ca)} &nbsp;|&nbsp; Marge : {fmtFCFA(sums.marge)} / {fmtFCFA(objectives.marge)} — {pct(sums.marge, objectives.marge)}
            </div>
          </div>

          {/* Donut: répartition des statuts */}
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold mb-2">Répartition des statuts — {semestre}</div>
            <div className="h-64">
              <Doughnut data={donutData} options={donutOptions} />
            </div>
          </div>

          {/* Bar comparatif visites */}
          <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm xl:col-span-3">
            <div className="text-sm font-semibold mb-2">Activité de visites — {semestre} (réalisé vs objectif)</div>
            <div className="h-64">
              <Bar data={visitsBarData} options={visitsBarOptions} />
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

/* Helpers */
function groupByStatus(deals = []) {
  const acc = {};
  for (const d of deals) {
    const s = (d.statut || "—").trim();
    acc[s] = (acc[s] || 0) + 1;
  }
  return acc;
}
