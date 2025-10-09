// src/pages/Objectives.jsx
import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { useAuth } from "../auth/AuthProvider";
import { SEMESTRES } from "../utils/constants";
import Select from "../components/Select";
import FormField from "../components/FormField";
import NumberInput from "../components/NumberInput";
import { useToast } from "../components/ToastProvider";

// ---- API utils ----
async function fetchHistory(userId, period, authToken) {
  const res = await fetch(`/api/objectives/history/${userId}/${period}`, {
    headers: { Authorization: `Bearer ${authToken}` },
  });
  if (!res.ok) return [];
  return await res.json(); // [{ id, userId, period, by, ts, ca, marge, visites, one2one, workshops }]
}

async function saveObjective({ userId, period, values, authToken }) {
  const res = await fetch(`/api/objectives`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({ userId, period, ...values }),
  });
  if (!res.ok) throw new Error("Erreur lors de l'enregistrement des objectifs");
  return await res.json();
}

async function saveSnapshot({ userId, period, values, by, authToken }) {
  const res = await fetch(`/api/objectives/history`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    // champs à plat + "by" (pas de nested {values})
    body: JSON.stringify({ userId, period, by, ...values }),
  });
  if (!res.ok) throw new Error("Erreur lors de la sauvegarde de l'historique");
  return await res.json();
}

// normalise les valeurs (compat anciennes clés éventuelles du store)
function normalize(obj = {}) {
  return {
    ca: Number(obj.ca ?? 0),
    marge: Number(obj.marge ?? 0),
    visites: Number(obj.visites ?? obj.visite ?? 0),
    one2one: Number(obj.one2one ?? 0),
    workshops: Number(obj.workshops ?? obj.workshop ?? 0),
  };
}

export default function Objectives() {
  const { state, dispatch } = useStore();
  const { user, can, token } = useAuth();
  const toast = useToast();

  const [semestre, setSemestre] = useState(
    state.selectedSemestre || SEMESTRES[0]?.value || ""
  );

  const [form, setForm] = useState(() =>
    normalize(state.objectives[semestre])
  );

  const [history, setHistory] = useState({}); // { [semestre]: Snapshot[] }

  // charge historique à chaque changement user/semestre/token
  useEffect(() => {
    if (!user?.id || !semestre || !token) return;
    fetchHistory(user.id, semestre, token)
      .then((arr) => {
        // s'assure que ts est une Date utilisable
        const fixed = arr.map((r) => ({ ...r, ts: r.ts ? r.ts : Date.now() }));
        setHistory((h) => ({ ...h, [semestre]: fixed }));
      })
      .catch(() => setHistory((h) => ({ ...h, [semestre]: [] })));
  }, [user?.id, semestre, token]);

  // remet le formulaire avec les valeurs courantes du store quand le semestre change
  useEffect(() => {
    const cur = normalize(state.objectives[semestre]);
    setForm(cur);
  }, [semestre, state.objectives]);

  const listForSemestre = useMemo(() => {
    const arr = history[semestre] || [];
    // tri du plus récent au plus ancien
    return [...arr].sort(
      (a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime()
    );
  }, [history, semestre]);

  const onChangeField = (partial) => {
    setForm((prev) => normalize({ ...prev, ...partial }));
  };

  const canEdit = can("objectives:update");

  const saveObjectives = async (e) => {
    e?.preventDefault?.();
    if (!canEdit) {
      toast.show("Tu n’as pas les droits pour modifier les objectifs.", "error");
      return;
    }
    try {
      // 1) enregistre la valeur courante (upsert)
      await saveObjective({
        userId: user.id,
        period: semestre,
        values: form,
        authToken: token,
      });

      // 2) historise avec les mêmes valeurs (et l'email comme "by")
      await saveSnapshot({
        userId: user.id,
        period: semestre,
        values: form,
        by: user?.email || user?.name || user?.id,
        authToken: token,
      });

      // 3) met à jour le store local
      dispatch({ type: "SET_SEMESTRE", payload: semestre });
      dispatch({ type: "SET_OBJECTIVES", payload: { semestre, values: form } });

      // 4) recharge l'historique
      const arr = await fetchHistory(user.id, semestre, token);
      setHistory((h) => ({ ...h, [semestre]: arr }));

      toast.show("Objectifs sauvegardés et historisés.", "success");
    } catch (err) {
      console.error(err);
      toast.show("Erreur lors de l’enregistrement.", "error");
    }
  };

  const restoreSnapshot = (snapIndex) => {
    if (!canEdit) {
      toast.show("Tu n’as pas les droits pour restaurer.", "error");
      return;
    }
    const arr = listForSemestre;
    const snap = arr[snapIndex];
    if (!snap) return;

    const restored = normalize(snap);
    setForm(restored);
    dispatch({ type: "SET_OBJECTIVES", payload: { semestre, values: restored } });
    toast.show("Objectifs restaurés à partir de l’historique.", "success");
  };

  const clearHistoryForSemestre = async () => {
    if (!canEdit) return;
    if (!confirm("Supprimer l’historique de ce semestre ?")) return;
    // TODO: si tu veux effacer côté backend, on peut ajouter DELETE /api/objectives/history?userId=&period=
    setHistory((h) => ({ ...h, [semestre]: [] }));
    toast.show("Historique supprimé pour ce semestre (local seulement).", "success");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white shadow-2xl backdrop-blur-xl">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(white 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        <div className="relative p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                Objectifs semestriels
              </h2>
              <p className="mt-1 text-white/80 text-sm">
                Définis les objectifs cibles et consulte l’historique par semestre.
              </p>
            </div>
            <div className="w-full md:w-64">
              <Select
                value={semestre}
                onChange={setSemestre}
                options={SEMESTRES}
                className="bg-white text-black border-white/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FORMULAIRE */}
      <form
        onSubmit={saveObjectives}
        className="rounded-2xl border border-black/10 bg-white/80 p-4 shadow-lg grid grid-cols-1 md:grid-cols-5 gap-4 animate-fade-in"
        style={{ animationDelay: "0.15s" }}
      >
        <FormField label="CA (CFA)">
          <NumberInput value={form.ca} onChange={(v) => onChangeField({ ca: v })} />
        </FormField>
        <FormField label="Marge (CFA)">
          <NumberInput value={form.marge} onChange={(v) => onChangeField({ marge: v })} />
        </FormField>
        <FormField label="Visites">
          <NumberInput step={1} value={form.visites} onChange={(v) => onChangeField({ visites: v })} />
        </FormField>
        <FormField label="One-2-One">
          <NumberInput step={1} value={form.one2one} onChange={(v) => onChangeField({ one2one: v })} />
        </FormField>
        <FormField label="Workshops">
          <NumberInput step={1} value={form.workshops} onChange={(v) => onChangeField({ workshops: v })} />
        </FormField>

        <div className="md:col-span-5 flex justify-end gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-orange-600 text-white border border-orange-600 hover:bg-orange-500 transition-all duration-200 font-semibold shadow hover:scale-105"
            disabled={!canEdit}
          >
            Sauvegarder
          </button>
          <button
            type="button"
            onClick={() =>
              setForm(normalize(state.objectives[semestre]))
            }
            className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-orange-50 transition-all duration-200 shadow"
          >
            Réinitialiser
          </button>
        </div>
      </form>

      {/* HISTORIQUE */}
      <div className="space-y-2 animate-fade-in" style={{ animationDelay: "0.2s" }}>
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-black">
            Historique — {semestre}
          </h3>
          {!!listForSemestre.length && canEdit && (
            <button
              onClick={clearHistoryForSemestre}
              className="text-xs rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-red-700 hover:bg-red-100"
            >
              Vider l’historique
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-4 shadow-lg overflow-x-auto">
          {listForSemestre.length === 0 ? (
            <div className="text-sm text-black/60">
              Aucun snapshot enregistré pour ce semestre.
            </div>
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
                {listForSemestre.map((snap, idx) => (
                  <tr key={snap.id || snap.ts} className="border-t border-black/5">
                    <td className="py-2 pr-4">
                      {new Date(snap.ts).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">{snap.by}</td>
                    <td className="py-2 pr-4">{Number(snap.ca ?? 0).toLocaleString()}</td>
                    <td className="py-2 pr-4">{Number(snap.marge ?? 0).toLocaleString()}</td>
                    <td className="py-2 pr-4">{snap.visites ?? 0}</td>
                    <td className="py-2 pr-4">{snap.one2one ?? 0}</td>
                    <td className="py-2 pr-4">{snap.workshops ?? 0}</td>
                    <td className="py-2">
                      <div className="flex justify-center">
                        <button
                          onClick={() => restoreSnapshot(idx)}
                          className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-all duration-200 shadow"
                          disabled={!canEdit}
                        >
                          Restaurer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          0% { opacity: 0; transform: translateY(10px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
