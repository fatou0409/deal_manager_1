// src/pages/objectives/Objectives.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { SEMESTRES } from "../../utils/constants";
import Select from "../../components/Select";
import FormField from "../../components/FormField";
import NumberInput from "../../components/NumberInput";
import { useToast } from "../../components/ToastProvider";

// --- API calls ---
async function saveObjective({ userId, period, values, token }) {
  const res = await fetch(`/api/objectives`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, period, ...values }),
  });
  if (!res.ok) throw new Error("Erreur lors de l'enregistrement des objectifs");
  return res.json();
}
async function saveSnapshot({ userId, period, values, token, by }) {
  const res = await fetch(`/api/objectives/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ userId, period, by, ...values }),
  });
  if (!res.ok) throw new Error("Erreur lors de la sauvegarde de l'historique");
  return res.json();
}
async function fetchHistory(userId, period, token) {
  const res = await fetch(`/api/objectives/history/${userId}/${period}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  return res.json();
}

export default function Objectives() {
  const { state, dispatch } = useStore();
  const { user, can, token } = useAuth();
  const toast = useToast();

  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isHistory = pathname.endsWith("/history"); // action secondaire
  const goTo = (where) => navigate(where, { replace: true });

  // Etat commun : semestre sélectionné
  const [semestre, setSemestre] = useState(state.selectedSemestre || SEMESTRES[0]?.value || "");

  // ----- Edition (page principale) -----
  const canEdit = can("objectives:update");
  const [form, setForm] = useState(() => ({
    ca: state.objectives[semestre]?.ca || 0,
    marge: state.objectives[semestre]?.marge || 0,
    visites: state.objectives[semestre]?.visites || 0,
    one2one: state.objectives[semestre]?.one2one || 0,
    workshops: state.objectives[semestre]?.workshops || 0,
  }));
  useEffect(() => {
    const cur = state.objectives[semestre] || { ca: 0, marge: 0, visites: 0, one2one: 0, workshops: 0 };
    setForm(cur);
  }, [semestre, state.objectives]);

  const onChangeField = (partial) => setForm((prev) => ({ ...prev, ...partial }));

  const onSave = async (e) => {
    e?.preventDefault?.();
    if (!canEdit) return toast.show("Tu n’as pas les droits pour modifier les objectifs.", "error");

    try {
      dispatch({ type: "SET_SEMESTRE", payload: semestre });
      dispatch({ type: "SET_OBJECTIVES", payload: { semestre, values: form } });

      await saveObjective({ userId: user.id, period: semestre, values: form, token });
      await saveSnapshot({ userId: user.id, period: semestre, values: form, token, by: user.email || user.id });

      toast.show("Objectifs sauvegardés et historisés.", "success");
    } catch {
      toast.show("Erreur lors de l’enregistrement des objectifs.", "error");
    }
  };

  // ----- Historique (action secondaire) -----
  const [history, setHistory] = useState([]);
  useEffect(() => {
    if (!isHistory) return; // ne fetch que si on est sur la vue historique
    if (!user?.id || !semestre || !token) return;
    fetchHistory(user.id, semestre, token).then(setHistory).catch(() => setHistory([]));
  }, [isHistory, user?.id, semestre, token]);

  const list = useMemo(() => [...history].sort((a, b) => new Date(b.ts) - new Date(a.ts)), [history]);

  const restore = (snap) => {
    dispatch({
      type: "SET_OBJECTIVES",
      payload: {
        semestre,
        values: {
          ca: Number(snap.ca ?? 0),
          marge: Number(snap.marge ?? 0),
          visites: Number(snap.visites ?? 0),
          one2one: Number(snap.one2one ?? 0),
          workshops: Number(snap.workshops ?? 0),
        },
      },
    });
    toast.show("Objectifs restaurés à partir de l’historique.", "success");
    goTo("/objectives/edit");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-600 to-black text-white p-6 shadow-2xl">
        <div className="flex items-end gap-4 justify-between">
          <div>
            <h2 className="text-2xl font-bold">Objectives</h2>
            <p className="text-sm opacity-80 mt-1">
              {isHistory ? "Historique des snapshots et restauration." : "Définis les objectifs semestriels."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Sélecteur de période */}
            <div className="w-56">
              <Select
                value={semestre}
                onChange={setSemestre}
                options={SEMESTRES}
                className="bg-white text-black border-white/40"
              />
            </div>

            {/* Action secondaire : switch edit/history */}
            {isHistory ? (
              <button
                type="button"
                onClick={() => goTo("/objectives/edit")}
                className="ml-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                title="Retour au tableau de bord"
              >
                ← Tableau de bord
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goTo("/objectives/history")}
                className="ml-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
                title="Voir l’historique des objectifs"
              >
                Historique
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      {!isHistory ? (
        <form
          onSubmit={onSave}
          className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-lg grid grid-cols-1 md:grid-cols-5 gap-4"
        >
          <FormField label="CA (CFA)"><NumberInput value={form.ca} onChange={(v) => onChangeField({ ca: v })} /></FormField>
          <FormField label="Marge (CFA)"><NumberInput value={form.marge} onChange={(v) => onChangeField({ marge: v })} /></FormField>
          <FormField label="Visites"><NumberInput step={1} value={form.visites} onChange={(v) => onChangeField({ visites: v })} /></FormField>
          <FormField label="One-2-One"><NumberInput step={1} value={form.one2one} onChange={(v) => onChangeField({ one2one: v })} /></FormField>
          <FormField label="Workshops"><NumberInput step={1} value={form.workshops} onChange={(v) => onChangeField({ workshops: v })} /></FormField>

          <div className="md:col-span-5 flex justify-end gap-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-orange-600 text-white border border-orange-600 hover:bg-orange-500 transition font-semibold shadow"
              disabled={!canEdit}
            >
              Sauvegarder
            </button>
            <button
              type="button"
              onClick={() =>
                setForm(state.objectives[semestre] || { ca: 0, marge: 0, visites: 0, one2one: 0, workshops: 0 })
              }
              className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-orange-50 transition shadow"
            >
              Réinitialiser
            </button>
          </div>
        </form>
      ) : (
        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-lg overflow-x-auto">
          {list.length === 0 ? (
            <div className="text-sm text-black/60">Aucun snapshot enregistré pour ce semestre.</div>
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
                    <td className="py-2 pr-4">{new Date(snap.ts).toLocaleString()}</td>
                    <td className="py-2 pr-4">{snap.by}</td>
                    <td className="py-2 pr-4">{Number(snap.ca ?? 0).toLocaleString()}</td>
                    <td className="py-2 pr-4">{Number(snap.marge ?? 0).toLocaleString()}</td>
                    <td className="py-2 pr-4">{snap.visites ?? 0}</td>
                    <td className="py-2 pr-4">{snap.one2one ?? 0}</td>
                    <td className="py-2 pr-4">{snap.workshops ?? 0}</td>
                    <td className="py-2">
                      <div className="flex justify-center">
                        <button
                          onClick={() => restore(snap)}
                          className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100"
                        >
                          Restaurer dans le tableau de bord
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
