// src/pages/objectives/ObjectivesForm.jsx
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { useAuth } from "../../auth/AuthProvider";
import { SEMESTRES } from "../../utils/constants";
import Select from "../../components/Select";
import { api } from "../../lib/api";
import FormField from "../../components/FormField";
import NumberInput from "../../components/NumberInput";
import { useToast } from "../../components/ToastProvider";

async function saveObjective({ userId, period, values, token }) {
  const body = { userId, period, ...values };
  const saved = await api(`/objectives`, { method: "PUT", body, token });
  return saved;
}

export default function ObjectivesForm() {
  const { state, dispatch } = useStore();
  const { user, can, token } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // ✅ Nouveaux états pour la gestion par Admin/Manager
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [allObjectives, setAllObjectives] = useState([]);

  // 🔴 Rediriger Business Developer vers la liste
  useEffect(() => {
    if (user?.role === 'BUSINESS_DEVELOPER') {
      toast.show("Seul votre manager peut créer des objectifs", "warning");
      navigate('/objectives', { replace: true });
    }
  }, [user, navigate, toast]);

  // ✅ Chargement des utilisateurs et de leurs objectifs si Admin/Manager
  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "MANAGER") {
      (async () => {
        try {
          const [usersData, objectivesData] = await Promise.all([
            api('/users'),
            api('/objectives'),
          ]);
          setUsers(Array.isArray(usersData) ? usersData : []);
          setAllObjectives(Array.isArray(objectivesData) ? objectivesData : []);
        } catch (error) {
          toast.show("Erreur de chargement des données", "error");
        }
      })();
    }
  }, [user, toast]);

  const [semestre, setSemestre] = useState(
    state.selectedSemestre || SEMESTRES[0]?.value || ""
  );
  const canEdit = can("objectives:update");

  const [form, setForm] = useState({
    ca: 0, marge: 0, visites: 0, one2one: 0, workshops: 0,
  });

  // ✅ Mettre à jour le formulaire quand le semestre ou l'utilisateur change
  useEffect(() => {
    if (!selectedUserId) {
      setForm({ ca: 0, marge: 0, visites: 0, one2one: 0, workshops: 0 });
      return;
    }
    const objective = allObjectives.find(
      (o) => o.userId === selectedUserId && o.period === semestre
    );
    setForm({
      ca: objective?.ca || 0,
      marge: objective?.marge || 0,
      visites: objective?.visites || 0,
      one2one: objective?.one2one || 0,
      workshops: objective?.workshops || 0,
    });
  }, [selectedUserId, semestre, allObjectives]);

  const onChangeField = (partial) =>
    setForm((prev) => ({ ...prev, ...partial }));

  const onSave = async (e) => {
    e?.preventDefault?.();

    // 🔴 Double vérification pour Business Developer
    if (user?.role === 'BUSINESS_DEVELOPER') {
      return toast.show("Vous ne pouvez pas créer d'objectifs", "error");
    }

    if (!canEdit)
      return toast.show("Tu n'as pas les droits pour modifier les objectifs.", "error");

    // ✅ Validation pour Admin/Manager
    if (!selectedUserId) {
      return toast.show("Veuillez sélectionner un utilisateur.", "error");
    }

    try {
      const savedObjective = await saveObjective({
        userId: selectedUserId,
        period: semestre,
        values: form,
        token,
      });

      // Mettre à jour la liste locale des objectifs
      setAllObjectives(prev => {
        const index = prev.findIndex(o => o.userId === selectedUserId && o.period === semestre);
        if (index > -1) {
          const newObjectives = [...prev];
          newObjectives[index] = savedObjective;
          return newObjectives;
        }
        return [...prev, savedObjective];
      });

      toast.show(`Objectifs pour ${savedObjective.user.name} sauvegardés.`, "success");
    } catch (err) {
      console.error("Erreur sauvegarde objectifs:", err);
      toast.show("Erreur lors de l'enregistrement des objectifs.", "error");
    }
  };

  // ✅ Filtre les utilisateurs pour n'afficher que les BDs et Managers
  const targetUsers = useMemo(() => {
    return users.filter(u => u.role === 'BUSINESS_DEVELOPER' || u.role === 'MANAGER');
  }, [users]);

  // Si Business Developer, ne rien afficher (sera redirigé)
  if (user?.role === 'BUSINESS_DEVELOPER') {
    return null;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white shadow-2xl">
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }}
        />
        <div className="absolute inset-0 bg-white/5" />
        <div className="relative p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Gestion des Objectifs
          </h2>
          <p className="mt-1 text-white/80 text-sm">
            Définissez les objectifs semestriels pour vos collaborateurs.
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase mb-1.5">
                Collaborateur
              </label>
              <Select
                value={selectedUserId}
                onChange={setSelectedUserId}
                options={targetUsers.map(u => ({ value: u.id, label: `${u.name || u.email} (${u.role})` }))}
                className="bg-white text-black border-white/40"
                placeholder="— Sélectionner un utilisateur —"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/80 uppercase mb-1.5">
                Semestre
              </label>
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

      {/* FORM */}
      <form
        onSubmit={onSave}
        className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
      >
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
        </div>

        <div className="mt-4 pt-4 border-t border-black/10 flex justify-end gap-2">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-orange-600 text-white border border-orange-600 hover:bg-orange-500 transition font-semibold shadow"
            disabled={!canEdit || !selectedUserId}
          >
            Enregistrer
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