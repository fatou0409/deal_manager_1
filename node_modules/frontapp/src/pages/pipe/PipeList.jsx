// src/pages/pipe/PipeList.jsx
import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../utils/api";
import DataTablePro from "../../components/DataTablePro";
import Select from "../../components/Select";
import { SEMESTRES } from "../../utils/constants";
import { fmtFCFA } from "../../utils/format";

export default function PipeList() {
  const { state, dispatch } = useStore();
  const { token } = useAuth();
  const toast = useToast();

  // (Re)charge les deals depuis l’API, puis on filtre côté UI
  useEffect(() => {
    (async () => {
      try {
        const rows = await api.get("/deals", { token });
        const data = Array.isArray(rows) ? rows : rows?.items || [];
        dispatch({ type: "SET_DEALS", payload: data });
      } catch (e) {
        toast.show(`Impossible de charger le pipe : ${e.message}`, "error");
      }
    })();
  }, [dispatch, token, toast]);

  // Pipes = seulement les opportunités marquées typeDeal='PIPE' sur le semestre courant
  const pipes = useMemo(() => {
    const cur = (state.deals || []).filter(
      (d) => d.semestre === state.selectedSemestre
    );
    return cur.filter((d) => d.typeDeal === "PIPE");
  }, [state.deals, state.selectedSemestre]);

  const columns = [
    { key: "client",     header: "Client" },
    { key: "commercial", header: "IC" },
    { key: "secteur",    header: "Secteur" },
    { key: "projet",     header: "Projets en vue" },
    {
      key: "ca",
      header: "Budget estimatif",
      render: (r) => fmtFCFA(Number(r.ca || 0)),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white shadow-2xl">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
        />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 md:p-8 flex items-center justify-between gap-3">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Pipe</h2>
          <div className="flex items-center gap-3">
            <div className="w-56">
              <Select
                value={state.selectedSemestre}
                onChange={(v) => dispatch({ type: "SET_SEMESTRE", payload: v })}
                options={SEMESTRES}
                className="bg-white text-black border-white/40"
              />
            </div>
            <Link
              to="/pipe/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white px-3 py-1.5 border border-white/20 hover:bg-white/20 transition text-sm"
            >
              + Nouvelle pipe
            </Link>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
        <DataTablePro columns={columns} rows={pipes} empty="Aucune opportunité en cours" />
      </div>

      <style>{`
        @keyframes fade-in { 0% {opacity:0; transform: translateY(10px) scale(0.98);} 100% {opacity:1; transform: translateY(0) scale(1);} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
