import React, { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { fmtFCFA } from "../../utils/format";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Title
);

const ORANGE = "#EA580C";   // tailwind orange-600
const BLACK  = "#111827";   // slate-900
const GRAY   = "#CBD5E1";   // slate-300

export default function DashboardCharts({ deals = [], visits = [], objectives = {} }) {
  // Agrégations
  const sums = useMemo(() => {
    const ca = deals.reduce((acc, d) => acc + Number(d.ca || 0), 0);
    const marge = deals.reduce((acc, d) => acc + Number(d.marge || 0), 0);
    const nVisite = visits.filter((v) => v.type === "Visite").length;
    const nOne = visits.filter((v) => v.type === "One-to-One").length;
    const nWorkshop = visits.filter((v) => v.type === "Workshop").length;
    return { ca, marge, nVisite, nOne, nWorkshop };
  }, [deals, visits]);

  const byKeySum = (arr, key) => {
    const map = {};
    for (const d of arr) {
      const k = d[key] || "—";
      map[k] = (map[k] || 0) + Number(d.ca || 0);
    }
    // tri décroissant et top 6
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  };

  const topSecteurs = useMemo(() => byKeySum(deals, "secteur"), [deals]);
  const topCommerciaux = useMemo(() => byKeySum(deals, "commercial"), [deals]);

  // Chart 1: CA/Marge vs Objectifs
  const kpiLabels = ["CA", "Marge"];
  const kpiRealise = [sums.ca, sums.marge];
  const kpiObjectif = [Number(objectives.ca || 0), Number(objectives.marge || 0)];
  const dataKPI = {
    labels: kpiLabels,
    datasets: [
      {
        label: "Réalisé",
        data: kpiRealise,
        backgroundColor: ORANGE,
        borderRadius: 8,
      },
      {
        label: "Objectif",
        data: kpiObjectif,
        backgroundColor: BLACK + "CC", // noir avec un peu de transparence
        borderRadius: 8,
      },
    ],
  };
  const optMoney = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: title },
      legend: { position: "bottom" },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${fmtFCFA(ctx.parsed.y ?? ctx.parsed)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (val) => fmtFCFA(val),
        },
        grid: { color: "#F1F5F9" },
      },
      x: { grid: { display: false } },
    },
  });

  // Chart 2: visites par type (doughnut)
  const dataVisits = {
    labels: ["Visite", "One-to-One", "Workshop"],
    datasets: [
      {
        data: [sums.nVisite, sums.nOne, sums.nWorkshop],
        backgroundColor: [ORANGE, BLACK, GRAY],
      },
    ],
  };
  const optVisits = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: "Répartition des visites" },
      legend: { position: "bottom" },
    },
  };

  // Chart 3: Top secteurs (CA)
  const labelsSecteurs = topSecteurs.map(([k]) => k);
  const valuesSecteurs = topSecteurs.map(([, v]) => v);
  const dataSecteur = {
    labels: labelsSecteurs,
    datasets: [
      {
        label: "CA",
        data: valuesSecteurs,
        backgroundColor: ORANGE,
        borderRadius: 8,
      },
    ],
  };
  const optHoriz = (title) => ({
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: { display: true, text: title },
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${fmtFCFA(ctx.parsed.x)}`,
        },
      },
    },
    scales: {
      x: {
        ticks: { callback: (val) => fmtFCFA(val) },
        grid: { color: "#F1F5F9" },
      },
      y: { grid: { display: false } },
    },
  });

  // Chart 4: Top commerciaux (CA)
  const labelsCom = topCommerciaux.map(([k]) => k);
  const valuesCom = topCommerciaux.map(([, v]) => v);
  const dataCom = {
    labels: labelsCom,
    datasets: [
      {
        label: "CA",
        data: valuesCom,
        backgroundColor: BLACK,
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* KPIs money */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm h-80">
        <Bar data={dataKPI} options={optMoney("Objectifs vs Réalisé")} />
        <div className="mt-3 text-xs text-black/60">
          CA: {fmtFCFA(sums.ca)} / {fmtFCFA(objectives.ca || 0)} · Marge: {fmtFCFA(sums.marge)} / {fmtFCFA(objectives.marge || 0)}
        </div>
      </div>

      {/* Répartition visites */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm h-80">
        <Doughnut data={dataVisits} options={optVisits} />
      </div>

      {/* Top secteurs */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm h-80">
        <Bar data={dataSecteur} options={optHoriz("Top secteurs (CA)")} />
      </div>

      {/* Top commerciaux */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm h-80">
        <Bar data={dataCom} options={optHoriz("Top commerciaux (CA)")} />
      </div>
    </div>
  );
}
