// frontapp/src/pages/pipe/PipeForm.jsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthProvider";
import { useStore } from "../../store/useStore";
import { useToast } from "../../components/ToastProvider";
import { api } from "../../utils/api";
import Select from "../../components/Select";
import FormField from "../../components/FormField";
import TextInput from "../../components/TextInput";
import NumberInput from "../../components/NumberInput";
import { SECTEURS as SECTEURS_RAW, COMMERCIAUX as COMMERCIAUX_RAW } from "../../utils/constants";
import { uid, fmtFCFA } from "../../utils/format";

const SAFE_OPTS = (arr) => (Array.isArray(arr) && arr.length ? arr : [{ value: "", label: "—" }]);

export default function PipeForm() {
  const { state } = useStore() || { state: {} };
  const { token, can } = useAuth() || {};
  const toast = useToast();
  const navigate = useNavigate();

  const SECTEURS = useMemo(() => SAFE_OPTS(SECTEURS_RAW), []);
  const COMMERCIAUX = useMemo(() => SAFE_OPTS(COMMERCIAUX_RAW), []);

  const CAN_CREATE = typeof can === "function" ? can("deal:create") : true;

  const [f, setF] = useState({
    client: "",
    ic: "",
    secteur: "",
    projets: "",
    budget: "",
  });

  const submit = async (e) => {
    e.preventDefault();
    if (!CAN_CREATE) return toast.show("Tu n'as pas le droit de créer une pipe.", "error");

    // Validation des champs requis
    if (!f.client?.trim()) return toast.show("Le client est requis.", "error");
    if (!f.ic) return toast.show("L'IC est requis.", "error");
    if (!f.secteur) return toast.show("Le secteur est requis.", "error");

    // Payload pour la table Pipe (seulement 5 champs + semestre)
    const payload = {
      id: uid(),
      client: f.client.trim(),
      ic: f.ic,
      secteur: f.secteur,
      projets: f.projets?.trim() || null,
      budget: Number(f.budget || 0),
      semestre: state?.selectedSemestre || "",
    };

    try {
      // ✅ Utilise la route /pipes au lieu de /deals
      const saved = await api.post("/pipes", payload, { token });
      toast.show("Pipe créée avec succès.", "success");
      navigate("/pipe");
    } catch (e2) {
      console.error('Erreur création pipe:', e2);
      toast.show(`Échec création pipe : ${e2.message}`, "error");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white shadow-2xl">
        <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Nouvelle pipe</h2>
          <p className="mt-1 text-white/80 text-sm">Renseigne l'opportunité en cours (budget estimatif).</p>
        </div>
      </div>

      {/* Formulaire avec les 5 champs de la table Pipe */}
      <form onSubmit={submit} className="space-y-6">
        <section className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Client" required>
              <TextInput
                value={f.client}
                onChange={(e) => setF({ ...f, client: e.target.value })}
                placeholder="Ex : Banque de Dakar"
              />
            </FormField>

            <FormField label="IC" required>
              <Select value={f.ic} onChange={(v) => setF({ ...f, ic: v })} options={COMMERCIAUX} />
            </FormField>

            <FormField label="Secteur" required>
              <Select value={f.secteur} onChange={(v) => setF({ ...f, secteur: v })} options={SECTEURS} />
            </FormField>

            <FormField label="Projets en vue">
              <TextInput
                value={f.projets}
                onChange={(e) => setF({ ...f, projets: e.target.value })}
                placeholder="Ex : Modernisation du réseau WAN"
              />
            </FormField>

            <FormField label="Budget estimatif (CFA)">
              <NumberInput value={f.budget} onChange={(v) => setF({ ...f, budget: v })} />
            </FormField>
          </div>

          <div className="text-xs text-black/60 mt-2">
            Aperçu budget : <span className="font-semibold">{fmtFCFA(Number(f.budget || 0))}</span>
          </div>
        </section>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={!CAN_CREATE}
            className="px-4 py-2 rounded-xl bg-orange-600 text-white border border-orange-600 hover:bg-orange-500 transition font-semibold shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={() => setF({ client: "", ic: "", secteur: "", projets: "", budget: "" })}
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