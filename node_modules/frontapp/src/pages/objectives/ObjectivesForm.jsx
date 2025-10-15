import { useEffect, useState } from "react";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { SEMESTRES } from "../../utils/constants";
import Select from "../../components/Select";
import FormField from "../../components/FormField";
import NumberInput from "../../components/NumberInput";
import { useToast } from "../../components/ToastProvider";

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

export default function ObjectivesForm() {
  const { state, dispatch } = useStore();
  const { user, can, token } = useAuth();
  const toast = useToast();

  const [semestre, setSemestre] = useState(
    state.selectedSemestre || SEMESTRES[0]?.value || ""
  );
  const canEdit = can("objectives:update");

  const [form, setForm] = useState(() => ({
    ca: state.objectives[semestre]?.ca || 0,
    marge: state.objectives[semestre]?.marge || 0,
    visites: state.objectives[semestre]?.visites || 0,
    one2one: state.objectives[semestre]?.one2one || 0,
    workshops: state.objectives[semestre]?.workshops || 0,
  }));

  useEffect(() => {
    const cur =
      state.objectives[semestre] || {
        ca: 0,
        marge: 0,
        visites: 0,
        one2one: 0,
        workshops: 0,
      };
    setForm(cur);
  }, [semestre, state.objectives]);

  const onChangeField = (partial) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const onSave = async (e) => {
    e?.preventDefault?.();
    if (!canEdit)
      return toast.show("Tu n’as pas les droits pour modifier les objectifs.", "error");

    try {
      dispatch({ type: "SET_SEMESTRE", payload: semestre });
      dispatch({ type: "SET_OBJECTIVES", payload: { semestre, values: form } });

      await saveObjective({
        userId: user.id,
        period: semestre,
        values: form,
        token,
      });
      await saveSnapshot({
        userId: user.id,
        period: semestre,
        values: form,
        token,
        by: user.email || user.id,
      });

      toast.show("Objectifs sauvegardés et historisés.", "success");
    } catch {
      toast.show("Erreur lors de l’enregistrement des objectifs.", "error");
    }
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
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Nouvelle objective</h2>
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
        </div>
      </div>

      {/* FORM */}
      <form
        onSubmit={onSave}
        className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm grid grid-cols-1 md:grid-cols-5 gap-4"
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
            className="px-4 py-2 rounded-xl bg-orange-600 text-white border border-orange-600 hover:bg-orange-500 transition font-semibold shadow"
            disabled={!canEdit}
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() =>
              setForm(
                state.objectives[semestre] || {
                  ca: 0,
                  marge: 0,
                  visites: 0,
                  one2one: 0,
                  workshops: 0,
                }
              )
            }
            className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-orange-50 transition shadow"
          >
            Réinitialiser
          </button>
        </div>
      </form>

      {/* Anim util */}
      <style>{`
        @keyframes fade-in { 0% {opacity:0; transform: translateY(10px) scale(0.98);} 100% {opacity:1; transform: translateY(0) scale(1);} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
