// src/pages/visits/VisitForm.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "../../components/FormField";
import Select from "../../components/Select";
import TextInput from "../../components/TextInput";
import { useAuth } from "../../auth/AuthProvider";
import { useStore } from "../../store/useStore";
import { SECTEURS, SEMESTRES, TYPES_VISITE } from "../../utils/constants";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../utils/api";
import { uid } from "../../utils/format";

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
  const { can, token } = useAuth(); // ✅ Ajout du token
  const toast = useToast();
  const navigate = useNavigate();

  const CAN_CREATE = can("visit:create");
  const [form, setForm] = useState({ ...emptyVisit, semestre: state.selectedSemestre });

  // Debug : afficher la valeur de CAN_CREATE
  useEffect(() => {
    console.log("VisitForm - CAN_CREATE:", CAN_CREATE);
    console.log("VisitForm - Token présent:", !!token);
  }, [CAN_CREATE, token]);

  useEffect(() => {
    setForm((f) => ({ ...f, semestre: state.selectedSemestre }));
  }, [state.selectedSemestre]);

  const submit = async (e) => {
    e.preventDefault();
    
    console.log("VisitForm - Submit - CAN_CREATE:", CAN_CREATE);
    
    if (!CAN_CREATE) {
      return toast.show("Tu n'as pas le droit de créer une visite.", "error");
    }

    // Validation des champs requis
    if (!form.date) {
      return toast.show("La date est requise.", "error");
    }
    if (!form.type) {
      return toast.show("Le type est requis.", "error");
    }
    if (!form.client) {
      return toast.show("Le client est requis.", "error");
    }
    if (!form.secteur) {
      return toast.show("Le secteur est requis.", "error");
    }

    const payload = {
      ...form,
      id: form.id || uid(),
    };

    try {
  console.log("VisitForm - Envoi à /visits:", payload);
  const saved = await api("/visits", { method: "POST", body: payload });
      dispatch({ type: "ADD_VISIT", payload: saved || payload });
      toast.show("Visite créée avec succès.", "success");
      // Rediriger vers la liste des visites après création
      navigate('/visits');
    } catch (err) {
      console.error("VisitForm - Erreur:", err);
      toast.show(`Échec création visite : ${err.message}`, "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO / HEADER */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white shadow-2xl">
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Nouvelle visite</h2>
          <p className="mt-1 text-white/80 text-sm">Planifie et documente ta visite client.</p>
        </div>
      </div>

      

      {/* FORM */}
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Planification */}
        <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
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

        {/* Détails client */}
        <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
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
          <button
            type="submit"
            disabled={!CAN_CREATE}
            className="px-4 py-2 rounded-xl bg-orange-600 text-white border border-orange-600 hover:bg-orange-500 transition font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...emptyVisit, semestre: state.selectedSemestre })}
            className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-orange-50 transition shadow"
          >
            Réinitialiser
          </button>
        </div>
      </form>

      <style>{`
        @keyframes fade-in { 0% {opacity:0; transform: translateY(10px) scale(0.98);} 100% {opacity:1; transform: translateY(0) scale(1);} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
}
