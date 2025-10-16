// src/pages/pipe/PipeList.jsx
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
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  // ✅ État local pour les pipes (pas dans le store deals)
  const [pipes, setPipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const CAN_UPDATE = can?.("deal:update");
  const CAN_DELETE = can?.("deal:delete");

  // ✅ Charge les pipes depuis /pipe (pas /deals)
  useEffect(() => {
    loadPipes();
  }, [state.selectedSemestre]);

  const loadPipes = async () => {
    setLoading(true);
    try {
      console.log("📥 Chargement pipes semestre:", state.selectedSemestre);
      
      // ✅ CORRIGÉ : Appelle /pipe au lieu de /deals
      const data = await api.get(`/pipe?semestre=${state.selectedSemestre}`);
      
      console.log("✅ Pipes chargés:", data);
      setPipes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("❌ Erreur chargement pipe:", e);
      toast.show(`Impossible de charger le pipe : ${e.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const onEdit = (row) => {
    if (!CAN_UPDATE)
      return toast.show("Tu n'as pas le droit de modifier une pipe.", "error");
    toast.show("Page d'édition pipe non configurée pour le moment.", "info");
  };

  const onDelete = async (id) => {
    if (!CAN_DELETE)
      return toast.show("Tu n'as pas le droit de supprimer une pipe.", "error");
    if (!confirm("Supprimer cette pipe ?")) return;

    try {
      console.log("🗑️ Suppression pipe:", id);
      
      // ✅ CORRIGÉ : Appelle /pipe/:id au lieu de /deals/:id
      await api.del(`/pipe/${id}`);
      
      console.log("✅ Pipe supprimé");
      
      // ✅ Mise à jour de l'état local
      setPipes(pipes.filter((p) => p.id !== id));
      toast.show("Pipe supprimée.", "success");
    } catch (e) {
      console.error("❌ Erreur suppression:", e);
      toast.show(`Suppression impossible : ${e.message}`, "error");
    }
  };

  const columns = [
    { key: "client", header: "Client" },
    { key: "commercial", header: "IC" },
    { key: "secteur", header: "Secteur" },
    { key: "projet", header: "Projets en vue" },
    {
      key: "ca",
      header: "Budget estimatif",
      render: (r) => fmtFCFA(Number(r.ca || 0)),
    },
    {
      key: "_actions",
      header: <div className="w-full text-center">Actions</div>,
      render: (r) => (
        <div className="flex items-center justify-center gap-2">
          {CAN_UPDATE && (
            <button
              onClick={() => onEdit(r)}
              className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700"
            >
              Éditer
            </button>
          )}
          {CAN_DELETE && (
            <button
              onClick={() => onDelete(r.id)}
              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700"
            >
              Supprimer
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white shadow-2xl">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
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
        {loading ? (
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        ) : (
          <DataTablePro
            columns={columns}
            rows={pipes}
            empty="Aucune opportunité en cours"
          />
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(0.4, 0, 0.2, 1) both;
        }
      `}</style>
    </div>
  );
}