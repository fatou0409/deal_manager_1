import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { SEMESTRES } from "../../utils/constants";
import Select from "../../components/Select";
import { useToast } from "../../components/ToastProvider";

async function fetchHistory(userId, period, token) {
  const res = await fetch(`/api/objectives/history/${userId}/${period}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function deleteSnapshot(id, token) {
  const res = await fetch(`/api/objectives/history/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

export default function ObjectivesList() {
  const { state, dispatch } = useStore();
  const { user, token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [semestre, setSemestre] = useState(
    state.selectedSemestre || SEMESTRES[0]?.value || ""
  );
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user?.id || !semestre || !token) return;
    fetchHistory(user.id, semestre, token)
      .then(setHistory)
      .catch(() => setHistory([]));
  }, [user?.id, semestre, token]);

  const list = useMemo(
    () => [...history].sort((a, b) => new Date(b.ts) - new Date(a.ts)),
    [history]
  );

  // Éditer = restaurer le snapshot en store puis ouvrir le formulaire
  const onEdit = (snap) => {
    dispatch({
      type: "SET_OBJECTIVES",
      payload: {
        semestre,
        values: {
          ca: Number(snap.ca ?? snap.values?.ca ?? 0),
          marge: Number(snap.marge ?? snap.values?.marge ?? 0),
          visites: Number(snap.visites ?? snap.values?.visites ?? 0),
          one2one: Number(snap.one2one ?? snap.values?.one2one ?? 0),
          workshops: Number(snap.workshops ?? snap.values?.workshops ?? 0),
        },
      },
    });
    toast.show("Objectifs chargés. Tu peux les modifier puis enregistrer.", "success");
    navigate("/objectives/new");
  };

  const onDelete = async (snap) => {
    if (!confirm("Supprimer ce snapshot ?")) return;
    const ok = await deleteSnapshot(snap.id, token);
    if (!ok) return toast.show("Suppression impossible.", "error");
    setHistory((h) => h.filter((x) => x.id !== snap.id));
    toast.show("Snapshot supprimé.", "success");
  };

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
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Objectives — {semestre}</h2>
            
          </div>

          <div className="flex items-center gap-3">
            <div className="w-56">
              <Select
                value={semestre}
                onChange={(v) => {
                  setSemestre(v);
                  dispatch({ type: "SET_SEMESTRE", payload: v });
                }}
                options={SEMESTRES}
                className="bg-white text-black border-white/40"
              />
            </div>

            <Link
              to="/objectives/new"
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 text-white px-3 py-1.5 border border-white/20 hover:bg-white/20 transition text-sm"
            >
              + Nouvelle objective
            </Link>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm overflow-x-auto">
        {list.length === 0 ? (
          <div className="text-sm text-black/60">Aucun snapshot pour ce semestre.</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-black/70">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Par</th>
                <th className="py-2 pr-4">CA</th>
                <th className="py-2 pr-4">Marge</th>
                <th className="py-2 pr-4">Visites</th>
                <th className="py-2 pr-4">One-2-One</th>
                <th className="py-2 pr-4">Workshops</th>
                <th className="py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((snap) => (
                <tr key={snap.id} className="border-t border-black/5">
                  <td className="py-2 pr-4">
                    {new Date(snap.ts).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{snap.by}</td>
                  <td className="py-2 pr-4">
                    {Number(snap.ca ?? snap.values?.ca ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">
                    {Number(snap.marge ?? snap.values?.marge ?? 0).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4">{snap.visites ?? snap.values?.visites ?? 0}</td>
                  <td className="py-2 pr-4">{snap.one2one ?? snap.values?.one2one ?? 0}</td>
                  <td className="py-2 pr-4">{snap.workshops ?? snap.values?.workshops ?? 0}</td>
                  <td className="py-2">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => onEdit(snap)}
                        className="rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
                      >
                        Éditer
                      </button>
                      <button
                        onClick={() => onDelete(snap)}
                        className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Anim util */}
      <style>{`
        @keyframes fade-in { 0% {opacity:0; transform: translateY(10px) scale(0.98);} 100% {opacity:1; transform: translateY(0) scale(1);} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
