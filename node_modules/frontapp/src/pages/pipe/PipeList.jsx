// src/pages/pipe/PipeList.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../utils/api";
import DataTablePro from "../../components/DataTablePro";
import Select from "../../components/Select";
import { SEMESTRES, SECTEURS, COMMERCIAUX } from "../../utils/constants";
import { fmtFCFA } from "../../utils/format";

export default function PipeList() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const [pipes, setPipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPipe, setEditingPipe] = useState(null);

  const CAN_UPDATE = can?.("deal:update");
  const CAN_DELETE = can?.("deal:delete");

  useEffect(() => {
    loadPipes();
  }, [state.selectedSemestre]);

  const loadPipes = async () => {
    setLoading(true);
    try {
      console.log("📥 Chargement pipes semestre:", state.selectedSemestre);
      
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
    if (!CAN_UPDATE) return toast.show("Tu n'as pas le droit de modifier une pipe.", "error");
    setEditingPipe({ ...row });
  };

  const saveEditedPipe = async () => {
    if (!editingPipe) return;
    
    try {
      // ✅ On envoie seulement les champs modifiables (pas dateCreation)
      const payload = {
        client: editingPipe.client,
        commercial: editingPipe.commercial,
        secteur: editingPipe.secteur,
        projet: editingPipe.projet,
        semestre: editingPipe.semestre,
        ca: Number(editingPipe.ca || 0),
        marge: 0, // Les pipes ont toujours marge = 0
        typeDeal: "PIPE",
        statut: "Open",
      };

      console.log("💾 Mise à jour pipe:", payload);

      const saved = await api.put(`/pipe/${editingPipe.id}`, payload);
      
      console.log("✅ Pipe mis à jour:", saved);

      // Mise à jour de l'état local
      setPipes(pipes.map((p) => (p.id === editingPipe.id ? saved || payload : p)));
      
      toast.show("Pipe mise à jour avec succès.", "success");
      setEditingPipe(null);
    } catch (err) {
      console.error("❌ Erreur mise à jour pipe:", err);
      toast.show(`Échec mise à jour : ${err.message}`, "error");
    }
  };

  const onDelete = async (id) => {
    if (!CAN_DELETE) return toast.show("Tu n'as pas le droit de supprimer une pipe.", "error");
    if (!confirm("Supprimer cette pipe ?")) return;

    try {
      console.log("🗑️ Suppression pipe:", id);
      
      await api.del(`/pipe/${id}`);
      
      console.log("✅ Pipe supprimé");
      
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

      {/* MODAL D'ÉDITION */}
      {editingPipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-3xl">
              <h3 className="text-xl font-bold">Modifier la pipe</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations de la pipe */}
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-3">Informations</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Client <span className="text-orange-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingPipe.client || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, client: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                      placeholder="Ex: Banque de Dakar"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      IC (Commercial) <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingPipe.commercial || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, commercial: e.target.value })}
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
                      Secteur <span className="text-orange-600">*</span>
                    </label>
                    <select
                      value={editingPipe.secteur || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, secteur: e.target.value })}
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
                      Budget estimatif (CFA)
                    </label>
                    <input
                      type="number"
                      value={editingPipe.ca || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, ca: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Projets en vue
                    </label>
                    <input
                      type="text"
                      value={editingPipe.projet || ""}
                      onChange={(e) => setEditingPipe({ ...editingPipe, projet: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                      placeholder="Ex: Modernisation du réseau WAN"
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-2 pt-4 border-t border-black/10">
                <button
                  onClick={() => setEditingPipe(null)}
                  className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEditedPipe}
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