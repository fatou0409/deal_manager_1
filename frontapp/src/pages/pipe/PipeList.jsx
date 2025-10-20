// frontapp/src/pages/pipe/PipeList.jsx
import { useEffect, useState } from "react";
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
  const { state } = useStore();
  const { token } = useAuth();
  const toast = useToast();
  
  const [pipes, setPipes] = useState([]);
  const [semestre, setSemestre] = useState(state?.selectedSemestre || "");

  // Charger les pipes depuis la route /pipes
  useEffect(() => {
    (async () => {
      try {
        // ✅ Charge depuis /pipes au lieu de /deals
        const data = await api.get(`/pipes?semestre=${semestre}`, { token });
        setPipes(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Erreur chargement pipes:', e);
        toast.show(`Impossible de charger les pipes : ${e.message}`, "error");
      }
    })();
  }, [semestre, token, toast]);

  // Définition des colonnes correspondant aux 5 champs de la table Pipe
  const columns = [
    { key: "client", header: "Client" },
    { key: "ic", header: "IC" },
    { key: "secteur", header: "Secteur" },
    { key: "projets", header: "Projets en vue" },
    {
      key: "budget",
      header: "Budget estimatif",
      render: (r) => fmtFCFA(Number(r.budget || 0)),
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
                value={semestre}
                onChange={(v) => setSemestre(v)}
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
        <DataTablePro 
          columns={columns} 
          rows={pipes} 
          empty="Aucune opportunité en cours" 
        />
      </div>

      <style>{`
        @keyframes fade-in { 0% {opacity:0; transform: translateY(10px) scale(0.98);} 100% {opacity:1; transform: translateY(0) scale(1);} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}