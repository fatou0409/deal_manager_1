// src/pages/Visits.jsx
import { useEffect, useMemo, useState } from "react";
import FormField from "../components/FormField";
import Select from "../components/Select";
import TextInput from "../components/TextInput";
import DataTablePro from "../components/DataTablePro";
import { useAuth } from "../auth/AuthProvider";
import { useStore } from "../store/useStore";
import ImportExportBar from "../components/ImportExportBar";
import { SECTEURS, SEMESTRES, TYPES_VISITE } from "../utils/constants";
import { useToast } from "../components/ToastProvider";

// 🔗 helper API (base = /api via .env.development)
const BASE = import.meta.env.VITE_API_URL || "/api";
async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

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

function Visits() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const CAN_CREATE = can("visit:create");
  const CAN_UPDATE = can("visit:update");
  const CAN_DELETE = can("visit:delete");

  const [form, setForm] = useState(emptyVisit);
  const [editId, setEditId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((f) => ({ ...f, semestre: state.selectedSemestre }));
  }, [state.selectedSemestre]);

  // 🔄 Hydrate depuis l'API si la liste est vide
  useEffect(() => {
    (async () => {
      try {
        if (state.visits.length === 0) {
          const list = await api("/visits"); // doit renvoyer un tableau
          const existing = new Set(state.visits.map((v) => v.id));
          list
            .filter((v) => !existing.has(v.id))
            .forEach((v) => dispatch({ type: "ADD_VISIT", payload: v }));
        }
      } catch (e) {
        console.warn("Hydrate visits failed:", e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    if (!editId && !CAN_CREATE) {
      toast.show("Tu n’as pas le droit de créer une visite.", "error");
      return;
    }
    if (editId && !CAN_UPDATE) {
      toast.show("Tu n’as pas le droit de modifier une visite.", "error");
      return;
    }

    const payload = { ...form };

    try {
      setSaving(true);
      if (editId) {
        // 🔧 UPDATE
        const updated = await api(`/visits/${editId}`, {
          method: "PUT",
          body: payload,
        });
        dispatch({ type: "UPDATE_VISIT", payload: updated });
        toast.show("Visite mise à jour.", "success");
      } else {
        // 🆕 CREATE
        const created = await api("/visits", { method: "POST", body: payload });
        dispatch({ type: "ADD_VISIT", payload: created });
        toast.show("Visite créée avec succès.", "success");
      }
      setForm(emptyVisit);
      setEditId("");
    } catch (err) {
      toast.show(`Erreur : ${err.message}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const onEdit = (row) => {
    if (!CAN_UPDATE) return toast.show("Tu n’as pas le droit de modifier une visite.", "error");
    setEditId(row.id);
    setForm({ ...row });
  };

  const onDelete = async (id) => {
    if (!CAN_DELETE) return toast.show("Tu n’as pas le droit de supprimer une visite.", "error");
    if (!confirm("Supprimer ?")) return;

    try {
      await api(`/visits/${id}`, { method: "DELETE" });
      dispatch({ type: "DELETE_VISIT", payload: id });
      toast.show("Visite supprimée.", "success");
    } catch (err) {
      toast.show(`Erreur : ${err.message}`, "error");
    }
  };

  const columns = useMemo(
    () => [
      { key: "date", header: "Date" },
      { key: "type", header: "Type" },
      { key: "semestre", header: "Semestre" },
      { key: "client", header: "Client" },
      { key: "secteur", header: "Secteur" },
      { key: "sujet", header: "Sujet" },
      { key: "accompagnants", header: "Accompagnants" },
      {
        key: "_actions",
        header: "Actions",
        render: (r) => (
          <div className="flex justify-center gap-2">
            {CAN_UPDATE && (
              <button
                onClick={() => onEdit(r)}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100 hover:shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-orange-400"
                title="Éditer"
              >
                <svg className="h-3.5 w-3.5 opacity-80 transition group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Éditer
              </button>
            )}
            {CAN_DELETE && (
              <button
                onClick={() => onDelete(r.id)}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 hover:shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-red-400"
                title="Supprimer"
              >
                <svg className="h-3.5 w-3.5 opacity-80 transition group-hover:opacity-100" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                </svg>
                Supprimer
              </button>
            )}
          </div>
        ),
      },
    ],
    [CAN_UPDATE, CAN_DELETE]
  );

  const exportColumns = [
    { key: "date", header: "Date" },
    { key: "type", header: "Type" },
    { key: "semestre", header: "Semestre" },
    { key: "client", header: "Client" },
    { key: "secteur", header: "Secteur" },
    { key: "sujet", header: "Sujet" },
    { key: "accompagnants", header: "Accompagnants" },
  ];

  const onImportRows = (rows) => {
    const normalize = (r) => ({
      id: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
      date: r["date"] || "",
      type: r["type"] || "",
      semestre: r["semestre"] || state.selectedSemestre,
      client: r["client"] || "",
      secteur: r["secteur"] || "",
      sujet: r["sujet"] || "",
      accompagnants: r["accompagnants"] || "",
    });

    const toAdd = rows.map(normalize);
    toAdd.forEach((v) => dispatch({ type: "ADD_VISIT", payload: v }));
    toast.show(`${toAdd.length} visite(s) importée(s).`, "success");
  };

  const fileBase = `visits_${state.selectedSemestre || "all"}`;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HERO */}
      <div className="relative overflow-hidden rounded-3xl border border-black/10 bg-gradient-to-tr from-orange-500 to-black text-white shadow-2xl backdrop-blur-xl">
        <div className="absolute inset-0 opacity-15 pointer-events-none"
             style={{ backgroundImage: "radial-gradient(white 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        <div className="relative p-6 md:p-8">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Visites & Suivi</h2>
              <p className="mt-1 text-white/80 text-sm">Planifiez et suivez vos rendez-vous clients.</p>
            </div>

            {/* IMPORT / EXPORT */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/15 shadow">
              <ImportExportBar
                resource="visit"
                title="Historique des visites"
                filename={fileBase}
                columns={exportColumns}
                rows={state.visits}
                onImportRows={onImportRows}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FORM + TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in" style={{animationDelay: '0.1s'}}>
        {/* FORM */}
        <form onSubmit={submit} className="lg:col-span-1 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-lg space-y-3 animate-fade-in" style={{animationDelay: '0.15s'}}>
          <h3 className="text-base font-semibold text-black">{editId ? "Modifier la visite" : "Nouvelle visite"}</h3>

          <FormField label="Date" required>
            <TextInput type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </FormField>

          <FormField label="Type" required>
            <Select value={form.type} onChange={(v) => setForm({ ...form, type: v })} options={TYPES_VISITE} />
          </FormField>

          <FormField label="Semestre" required>
            <Select value={form.semestre} onChange={(v) => setForm({ ...form, semestre: v })} options={SEMESTRES} />
          </FormField>

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

          <div className="pt-2 flex gap-2">
            <button
              disabled={saving || (!editId && !CAN_CREATE) || (editId && !CAN_UPDATE)}
              className={`px-4 py-2 rounded-xl border transition-all duration-200 font-semibold shadow hover:scale-105 ${
                (!editId && !CAN_CREATE) || (editId && !CAN_UPDATE)
                  ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
                  : "bg-orange-600 text-white border-orange-600 hover:bg-orange-500"
              }`}
            >
              {saving ? "En cours..." : editId ? "Mettre à jour" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => { setForm(emptyVisit); setEditId(""); }}
              className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-orange-50 transition-all duration-200 shadow"
            >
              Réinitialiser
            </button>
          </div>
        </form>

        {/* TABLE */}
        <div className="lg:col-span-2 space-y-3 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <h3 className="text-base font-semibold text-black">Historique</h3>
          <DataTablePro columns={columns} rows={state.visits} empty="Aucune visite" />
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

export default Visits;
