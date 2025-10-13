// src/pages/deals/DealForm.jsx
import { useEffect, useState } from "react";
import FormField from "../../components/FormField";
import Select from "../../components/Select";
import NumberInput from "../../components/NumberInput";
import TextInput from "../../components/TextInput";
import { useToast } from "../../components/ToastProvider";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { SECTEURS, SEMESTRES, TYPES_DEAL, COMMERCIAUX, AV_SUPPORTS, STATUTS } from "../../utils/constants";
import { uid } from "../../utils/format";

const emptyDeal = {
  id: "",
  projet: "",
  client: "",
  secteur: "",
  dateCreation: "",
  typeDeal: "",
  commercial: "",
  supportAV: "",
  semestre: "",
  ca: "",
  marge: "",
  statut: "",
  dateDerniereModif: "",
};

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function DealForm() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const CAN_CREATE = can("deal:create");

  const [form, setForm] = useState({ ...emptyDeal, semestre: state.selectedSemestre });
  const [gagne, setGagne]= useState(false);

  useEffect(() => {
    setForm((f) => ({ ...f, semestre: state.selectedSemestre }));
  }, [state.selectedSemestre]);
  



  const submit = (e) => {
    e.preventDefault();
    if (!CAN_CREATE) return toast.show("Tu n’as pas le droit de créer un deal.", "error");

    const isGagne = (form.statut || "").toLowerCase().startsWith("gagn");
    const payload = {
      ...form,
      id: uid(),
      ca: isGagne ? Number(form.ca || 0) : 0,
      marge: isGagne ? Number(form.marge || 0) : 0,
      dateCreation: form.dateCreation || todayStr(),
      dateDerniereModif: todayStr(),
    };

    dispatch({ type: "ADD_DEAL", payload });
    toast.show("Deal créé avec succès.", "success");
    setForm({ ...emptyDeal, semestre: state.selectedSemestre });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-600 to-black text-white p-6 shadow-2xl">
        <h2 className="text-2xl font-bold">Créer un nouveau deal</h2>
        <p className="text-sm opacity-80 mt-1">Renseigne les informations du projet client et les indicateurs clés.</p>
      </div>

      <form onSubmit={submit} className="space-y-6">
        {/* Grid 2 colonnes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 - Infos client */}
          <section className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow">
            <h3 className="font-semibold text-orange-600 mb-3">Informations client</h3>
            <div className="space-y-3">
              <FormField label="Projet" required>
                <TextInput value={form.projet} onChange={(e) => setForm({ ...form, projet: e.target.value })} placeholder="Ex: Mise en place supervision réseau" />
              </FormField>

              <FormField label="Client" required>
                <TextInput value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Ex: Banque de Dakar" />
              </FormField>

              <FormField label="Secteur" required>
                <Select value={form.secteur} onChange={(v) => setForm({ ...form, secteur: v })} options={SECTEURS} />
              </FormField>

              <FormField label="Date de création" required>
                <TextInput type="date" value={form.dateCreation} onChange={(e) => setForm({ ...form, dateCreation: e.target.value })} />
              </FormField>
            </div>
          </section>

          {/* Card 2 - Détails commerciaux */}
          <section className="rounded-2xl border border-black/10 bg-white/80 p-5 shadow">
            <h3 className="font-semibold text-orange-600 mb-3">Détails commerciaux</h3>
            <div className="space-y-3">
              <FormField label="Type de deal" required>
                <Select value={form.typeDeal} onChange={(v) => setForm({ ...form, typeDeal: v })} options={TYPES_DEAL} />
              </FormField>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Commercial" required>
                  <Select value={form.commercial} onChange={(v) => setForm({ ...form, commercial: v })} options={COMMERCIAUX} />
                </FormField>
                <FormField label="Support AV">
                  <Select value={form.supportAV} onChange={(v) => setForm({ ...form, supportAV: v })} options={AV_SUPPORTS} />
                </FormField>
              </div>

              <FormField label="Semestre" required>
                <Select value={form.semestre} onChange={(v) => setForm({ ...form, semestre: v })} options={SEMESTRES} />
              </FormField>

              <FormField label="Statut" required>
                <Select value={form.statut} onChange={(v) => 
                  {
                    setForm({ ...form, statut: v });
                    setGagne( (v || "").includes("Deal gagné"));
                  }
                } options={STATUTS} />
              </FormField>
            </div>
          </section>

          {/* Card 3 - Chiffres & Statut (full width) */}
          {
            gagne && (<section className="md:col-span-2 rounded-2xl border border-black/10 bg-white/80 p-5 shadow">
            <h3 className="font-semibold text-orange-600 mb-3">Chiffres clés</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Chiffre d'affaire (CFA)">
                <NumberInput value={form.ca} onChange={(v) => setForm({ ...form, ca: v })} />
              </FormField>
              <FormField label="Marge (CFA)">
                <NumberInput value={form.marge} onChange={(v) => setForm({ ...form, marge: v })} />
              </FormField>
            </div>
            <p className="text-xs text-black/50 mt-2">Note : CA & Marge ne sont comptabilisés que si le statut commence par “Gagn…”.</p>
          </section>)
          }
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            disabled={!CAN_CREATE}
            className="px-4 py-2 rounded-xl bg-orange-600 text-white border border-orange-600 hover:bg-orange-500 transition font-semibold shadow"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...emptyDeal, semestre: state.selectedSemestre })}
            className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-orange-50 transition shadow"
          >
            Réinitialiser
          </button>
        </div>
      </form>
    </div>
  );
}
