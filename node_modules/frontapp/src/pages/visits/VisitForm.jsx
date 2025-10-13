// src/pages/visits/VisitForm.jsx
import { useEffect, useState } from "react";
import FormField from "../../components/FormField";
import Select from "../../components/Select";
import TextInput from "../../components/TextInput";
import { useAuth } from "../../auth/AuthProvider";
import { useStore } from "../../store/useStore";
import { SECTEURS, SEMESTRES, TYPES_VISITE } from "../../utils/constants";
import { useToast } from "../../components/ToastProvider";

const emptyVisit = {
  id: "",
  date: "",
  type: "",
  semestre: "",
  client: "",
  secteur: "",
  sujet: "",
  accompagnants: "",
};

export default function VisitForm() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const CAN_CREATE = can("visit:create");
  const [form, setForm] = useState({ ...emptyVisit, semestre: state.selectedSemestre });

  useEffect(() => {
    setForm((f) => ({ ...f, semestre: state.selectedSemestre }));
  }, [state.selectedSemestre]);

  const submit = (e) => {
    e.preventDefault();
    if (!CAN_CREATE) return toast.show("Tu n’as pas le droit de créer une visite.", "error");

    const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    dispatch({ type: "ADD_VISIT", payload: { ...form, id } });
    toast.show("Visite créée avec succès.", "success");
    setForm({ ...emptyVisit, semestre: state.selectedSemestre });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-600 to-black text-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold">Nouvelle visite</h2>
        <p className="text-sm opacity-80 mt-1">Planifie et documente ta visite client.</p>
      </div>

      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bloc 1 : Planification */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow">
          <h3 className="font-semibold text-orange-600 mb-3">Planification</h3>
          <div className="space-y-3">
            <FormField label="Date" required>
              <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </FormField>

            <FormField label="Type" required>
              <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPES_VISITE} />
            </FormField>

            <FormField label="Semestre" required>
              <Select value={form.semestre} onChange={(v) => setForm({ ...form, semestre: v })} options={SEMESTRES} />
            </FormField>
          </div>
        </section>

        {/* Bloc 2 : Détails client */}
        <section className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow">
          <h3 className="font-semibold text-orange-600 mb-3">Détails client</h3>
          <div className="space-y-3">
            <FormField label="Client" required>
              <TextInput value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Ex: Banque de Dakar" />
            </FormField>

            <FormField label="Secteur" required>
              <Select value={form.secteur} onChange={(v) => setForm({ ...form, secteur: v })} options={SECTEURS} />
            </FormField>

            <FormField label="Sujet" required>
              <TextInput value={form.sujet} onChange={(e) => setForm({ ...form, sujet: e.target.value })} placeholder="Ex: suivi partenariat" />
            </FormField>

            <FormField label="Accompagnants">
              <TextInput value={form.accompagnants} onChange={(e) => setForm({ ...form, accompagnants: e.target.value })} placeholder="Noms séparés par des virgules" />
            </FormField>
          </div>
        </section>

        {/* Actions */}
        <div className="md:col-span-2 flex justify-end gap-2">
          <button disabled={!CAN_CREATE} className="px-4 py-2 rounded-xl bg-orange-600 text-white border border-orange-600 hover:bg-orange-500 transition font-semibold shadow">
            Enregistrer
          </button>
          <button type="button" onClick={() => setForm({ ...emptyVisit, semestre: state.selectedSemestre })} className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-orange-50 transition shadow">
            Réinitialiser
          </button>
        </div>
      </form>
    </div>
  );
}
