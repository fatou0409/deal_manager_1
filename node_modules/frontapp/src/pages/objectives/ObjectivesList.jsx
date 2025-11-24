// src/pages/objectives/ObjectivesList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { SEMESTRES } from "../../utils/constants";
import Select from "../../components/Select";
import { useToast } from "../../components/ToastProvider";
import { fmtFCFA } from "../../utils/format";

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

async function updateObjective({ userId, period, values, token }) {
  const res = await fetch(`/api/objectives`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId, period, ...values }),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour");
  return res.json();
}

async function saveSnapshot({ userId, period, values, token, by }) {
  const res = await fetch(`/api/objectives/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ userId, period, by, ...values }),
  });
  if (!res.ok) throw new Error("Erreur lors de la sauvegarde de l'historique");
  return res.json();
}

export default function ObjectivesList() {
  const { state, dispatch } = useStore();
  const { user, token, can } = useAuth();
  const toast = useToast();

  const [semestre, setSemestre] = useState(
    state.selectedSemestre || SEMESTRES[0]?.value || ""
  );
  const [history, setHistory] = useState([]);
  const [editingObjective, setEditingObjective] = useState(null);

  const canEdit = can("objectives:update");

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

  const onEdit = (snap) => {
    if (!canEdit) return toast.show("Tu n'as pas les droits pour modifier les objectifs.", "error");

    setEditingObjective({
      id: snap.id,
      userId: user.id,
      period: semestre,
      ca: Number(snap.ca ?? snap.values?.ca ?? 0),
      marge: Number(snap.marge ?? snap.values?.marge ?? 0),
      visites: Number(snap.visites ?? snap.values?.visites ?? 0),
      one2one: Number(snap.one2one ?? snap.values?.one2one ?? 0),
      workshops: Number(snap.workshops ?? snap.values?.workshops ?? 0),
    });
  };

  const saveEditedObjective = async () => {
    if (!editingObjective) return;

    try {
      const values = {
        ca: Number(editingObjective.ca || 0),
        marge: Number(editingObjective.marge || 0),
        visites: Number(editingObjective.visites || 0),
        one2one: Number(editingObjective.one2one || 0),
        workshops: Number(editingObjective.workshops || 0),
      };

      await updateObjective({
        userId: user.id,
        period: semestre,
        values,
        token,
      });

      await saveSnapshot({
        userId: user.id,
        period: semestre,
        values,
        token,
        by: user.email || user.id,
      });

      dispatch({
        type: "SET_OBJECTIVES",
        payload: { semestre, values },
      });

      const newHistory = await fetchHistory(user.id, semestre, token);
      setHistory(newHistory);

      toast.show("Objectifs mis à jour avec succès.", "success");
      setEditingObjective(null);
    } catch (err) {
      console.error("Erreur mise à jour objectifs:", err);
      toast.show(`Échec mise à jour : ${err.message}`, "error");
    }
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
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Objectifs — {semestre}</h2>
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
              + Nouvel objectif
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
                    {fmtFCFA(Number(snap.ca ?? snap.values?.ca ?? 0))}
                  </td>
                  <td className="py-2 pr-4">
                    {fmtFCFA(Number(snap.marge ?? snap.values?.marge ?? 0))}
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

      {/* MODAL D'ÉDITION */}
      {editingObjective && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-orange-500 text-white p-6 rounded-t-3xl">
              <h3 className="text-xl font-bold">Modifier les objectifs — {semestre}</h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Chiffres clés */}
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-3">Objectifs financiers</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      CA (CFA)
                    </label>
                    <input
                      type="number"
                      value={editingObjective.ca || ""}
                      onChange={(e) => setEditingObjective({ ...editingObjective, ca: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Marge (CFA)
                    </label>
                    <input
                      type="number"
                      value={editingObjective.marge || ""}
                      onChange={(e) => setEditingObjective({ ...editingObjective, marge: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Activités */}
              <div>
                <h4 className="text-sm font-semibold text-orange-600 mb-3">Objectifs d'activité</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Visites
                    </label>
                    <input
                      type="number"
                      value={editingObjective.visites || ""}
                      onChange={(e) => setEditingObjective({ ...editingObjective, visites: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      One-2-One
                    </label>
                    <input
                      type="number"
                      value={editingObjective.one2one || ""}
                      onChange={(e) => setEditingObjective({ ...editingObjective, one2one: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-black/70 uppercase mb-1.5">
                      Workshops
                    </label>
                    <input
                      type="number"
                      value={editingObjective.workshops || ""}
                      onChange={(e) => setEditingObjective({ ...editingObjective, workshops: e.target.value })}
                      className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-2 pt-4 border-t border-black/10">
                <button
                  onClick={() => setEditingObjective(null)}
                  className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={saveEditedObjective}
                  className="px-4 py-2 rounded-xl bg-orange-600 text-white hover:bg-orange-500 transition font-semibold"
                >
                  Sauvegarder
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Anim util */}
      <style>{`
        @keyframes fade-in { 0% {opacity:0; transform: translateY(10px) scale(0.98);} 100% {opacity:1; transform: translateY(0) scale(1);} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
