// src/pages/Deals.jsx
import { useEffect, useState, useMemo } from "react";
import FormField from "../components/FormField";
import Select from "../components/Select";
import NumberInput from "../components/NumberInput";
import TextInput from "../components/TextInput";
import { useToast } from "../components/ToastProvider";
import { useStore } from "../store/useStore";

// Tableau avancé (tri/filtre/pagination)
import DataTablePro from "../components/DataTablePro";
import { useAuth } from "../auth/AuthProvider";
import ImportExportBar from "../components/ImportExportBar";

import {
  SECTEURS,
  SEMESTRES,
  TYPES_DEAL,
  COMMERCIAUX,
  AV_SUPPORTS,
  STATUTS,
} from "../utils/constants";
import { fmtFCFA, uid } from "../utils/format";

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

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function Deals() {
  const { state, dispatch } = useStore();
  const { can } = useAuth();
  const toast = useToast();

  const CAN_CREATE = can("deal:create");
  const CAN_UPDATE = can("deal:update");
  const CAN_DELETE = can("deal:delete");

  const [form, setForm] = useState(emptyDeal);
  const [editId, setEditId] = useState("");

  // 👉 n'afficher que les deals du semestre sélectionné
  const dealsOfSemestre = useMemo(
    () => state.deals.filter((d) => d.semestre === state.selectedSemestre),
    [state.deals, state.selectedSemestre]
  );

  useEffect(() => {
    setForm((f) => ({ ...f, semestre: state.selectedSemestre }));
  }, [state.selectedSemestre]);

  // 🔄 Hydrate depuis l'API si la liste est vide (sans dépendre d'une action HYDRATE spécifique)
  useEffect(() => {
    (async () => {
      try {
        if (state.deals.length === 0) {
          const list = await api("/deals"); // le backend renvoie un tableau avec champs FR
          const existing = new Set(state.deals.map((d) => d.id));
          list
            .filter((d) => !existing.has(d.id))
            .forEach((d) => dispatch({ type: "ADD_DEAL", payload: d }));
        }
      } catch (e) {
        // silence soft si backend down
        console.warn("Hydrate deals failed:", e.message);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e) => {
    e.preventDefault();

    if (!editId && !CAN_CREATE) {
      toast.show("Tu n’as pas le droit de créer un deal.", "error");
      return;
    }
    if (editId && !CAN_UPDATE) {
      toast.show("Tu n’as pas le droit de modifier un deal.", "error");
      return;
    }

    // Si le statut n'est pas "Gagné", CA/Marge = 0
    const isGagne =
      (form.statut || "").toLowerCase() === "gagné" ||
      (form.statut || "").toLowerCase() === "gagne";

    // on garde TES noms de champs (projet, client, secteur, typeDeal, supportAV, ...)
    const payload = {
      ...form,
      ca: isGagne ? Number(form.ca || 0) : 0,
      marge: isGagne ? Number(form.marge || 0) : 0,
      dateDerniereModif: todayStr(),
    };

    try {
      if (editId) {
        // 🔧 UPDATE (PUT) → /api/deals/:id
        const updated = await api(`/deals/${editId}`, {
          method: "PUT",
          body: payload,
        });
        dispatch({ type: "UPDATE_DEAL", payload: updated });
        toast.show("Deal mis à jour.", "success");
      } else {
        // 🆕 CREATE (POST) → /api/deals
        if (!payload.dateCreation) payload.dateCreation = todayStr();
        const created = await api("/deals", { method: "POST", body: payload });
        dispatch({ type: "ADD_DEAL", payload: created });
        toast.show("Deal créé avec succès.", "success");
      }

      setForm(emptyDeal);
      setEditId("");
    } catch (err) {
      toast.show(`Erreur : ${err.message}`, "error");
    }
  };

  const onEdit = (row) => {
    if (!CAN_UPDATE) return toast.show("Tu n’as pas le droit de modifier un deal.", "error");
    setEditId(row.id);
    setForm({ ...row });
  };

  const onDelete = async (id) => {
    if (!CAN_DELETE) return toast.show("Tu n’as pas le droit de supprimer un deal.", "error");
    if (!confirm("Supprimer ce deal ?")) return;

    try {
      await api(`/deals/${id}`, { method: "DELETE" });
      dispatch({ type: "DELETE_DEAL", payload: id });
      toast.show("Deal supprimé.", "success");
    } catch (err) {
      toast.show(`Erreur : ${err.message}`, "error");
    }
  };

  // Colonnes (CA/Marge affichent 0 si statut ≠ Gagné) — colonne "Dernière modif." SUPPRIMÉE
  const columns = useMemo(
    () => [
      { key: "projet", header: "Projet" },
      { key: "client", header: "Client" },
      { key: "secteur", header: "Secteur" },
      { key: "semestre", header: "Semestre" },
      {
        key: "ca",
        header: "CA",
        render: (r) => {
          const isGagne =
            (r.statut || "").toLowerCase() === "gagné" ||
            (r.statut || "").toLowerCase() === "gagne";
          return fmtFCFA(isGagne ? r.ca : 0);
        },
      },
      {
        key: "marge",
        header: "Marge",
        render: (r) => {
          const isGagne =
            (r.statut || "").toLowerCase() === "gagné" ||
            (r.statut || "").toLowerCase() === "gagne";
          return fmtFCFA(isGagne ? r.marge : 0);
        },
      },
      { key: "statut", header: "Statut" },
      {
        key: "_actions",
        header: <div className="w-full text-center">Actions</div>,
        render: (r) => (
          <div className="flex items-center justify-center gap-2">
            {CAN_UPDATE && (
              <button
                onClick={() => onEdit(r)}
                className="group inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-700 transition hover:bg-orange-100 hover:shadow-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-orange-400"
                title="Éditer"
              >
                <svg
                  className="h-3.5 w-3.5 opacity-80 transition group-hover:opacity-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
                <svg
                  className="h-3.5 w-3.5 opacity-80 transition group-hover:opacity-100"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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

  // Colonnes export/import (inchangé)
  const exportColumns = [
    { key: "projet", header: "Projet" },
    { key: "client", header: "Client" },
    { key: "secteur", header: "Secteur" },
    { key: "dateCreation", header: "Date de création" },
    { key: "typeDeal", header: "Type de deal" },
    { key: "commercial", header: "Commercial" },
    { key: "supportAV", header: "Support AV" },
    { key: "semestre", header: "Semestre" },
    { key: "ca", header: "CA" },
    { key: "marge", header: "Marge" },
    { key: "statut", header: "Statut" },
    { key: "dateDerniereModif", header: "Date dernière modification" },
  ];

  const onImportRows = (rows) => {
    const normalize = (r) => {
      const statut = (r["statut"] || "").toString().trim();
      const isGagne =
        statut.toLowerCase() === "gagné" || statut.toLowerCase() === "gagne";
      const caRaw =
        r["ca"] ||
        r["chiffre d'affaire (cfa)"] ||
        r["chiffre d’affaire (cfa)"] ||
        0;
      const margeRaw = r["marge"] || r["marge (cfa)"] || 0;

      return {
        id: uid(),
        projet: r["projet"] || "",
        client: r["client"] || "",
        secteur: r["secteur"] || "",
        dateCreation: r["date de création"] || r["datecreation"] || "",
        typeDeal: r["type de deal"] || r["typedeal"] || "",
        commercial: r["commercial"] || "",
        // 🔸 Support AV n'est pas obligatoire → on accepte vide
        supportAV: r["support av"] || r["supportav"] || "",
        // 🔸 attache au semestre courant par défaut
        semestre: r["semestre"] || state.selectedSemestre,
        // 🔸 CA/Marge seulement si gagné, sinon 0
        ca: isGagne ? Number(caRaw || 0) : 0,
        marge: isGagne ? Number(margeRaw || 0) : 0,
        statut,
        dateDerniereModif:
          r["date dernière modification"] ||
          r["datedernieremodif"] ||
          todayStr(),
      };
    };

    const toAdd = rows.map(normalize);
    toAdd.forEach((d) => dispatch({ type: "ADD_DEAL", payload: d }));
    toast.show(`${toAdd.length} deal(s) importé(s).`, "success");
  };

  const fileBase = `deals_${state.selectedSemestre || "all"}`;

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
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Deals</h2>
              <p className="mt-1 text-white/80 text-sm">
                Créez et pilotez vos opportunités commerciales.
              </p>
            </div>

            {/* IMPORT / EXPORT */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/15 shadow-lg animate-fade-in" style={{animationDelay: '0.2s'}}>
              <ImportExportBar
                resource="deal"
                title="Liste des Deals"
                filename={fileBase}
                columns={exportColumns}
                // exporte le semestre courant (cohérent avec l'affichage)
                rows={dealsOfSemestre}
                onImportRows={onImportRows}
              />
            </div>
          </div>
        </div>
      </div>

      {/* FORM + TABLE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* FORM */}
        <form
          onSubmit={submit}
          className="lg:col-span-1 rounded-2xl border border-black/10 bg-white/80 p-4 shadow-lg space-y-3 animate-fade-in"
          style={{animationDelay: '0.15s'}}
        >
          <h3 className="text-base font-semibold text-black">
            {editId ? "Modifier le Deal" : "Créer un nouveau deal"}
          </h3>

          <FormField label="Projet" required>
            <TextInput
              value={form.projet}
              onChange={(e) => setForm({ ...form, projet: e.target.value })}
              placeholder="Ex: Mise en place supervision réseau"
            />
          </FormField>

          <FormField label="Client" required>
            <TextInput
              value={form.client}
              onChange={(e) => setForm({ ...form, client: e.target.value })}
              placeholder="Ex: Banque de Dakar"
            />
          </FormField>

          <FormField label="Secteur" required>
            <Select
              value={form.secteur}
              onChange={(v) => setForm({ ...form, secteur: v })}
              options={SECTEURS}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Date de création" required>
              <TextInput
                type="date"
                value={form.dateCreation}
                onChange={(e) =>
                  setForm({ ...form, dateCreation: e.target.value })}
              />
            </FormField>
            <div />
          </div>

          <FormField label="Type de deal" required>
            <Select
              value={form.typeDeal}
              onChange={(v) => setForm({ ...form, typeDeal: v })}
              options={TYPES_DEAL}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Commercial" required>
              <Select
                value={form.commercial}
                onChange={(v) => setForm({ ...form, commercial: v })}
                options={COMMERCIAUX}
              />
            </FormField>
            {/* 🔸 Support AV NON obligatoire */}
            <FormField label="Support AV">
              <Select
                value={form.supportAV}
                onChange={(v) => setForm({ ...form, supportAV: v })}
                options={AV_SUPPORTS}
              />
            </FormField>
          </div>

          <FormField label="Semestre" required>
            <Select
              value={form.semestre}
              onChange={(v) => setForm({ ...form, semestre: v })}
              options={SEMESTRES}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Chiffre d'affaire (CFA)">
              <NumberInput
                value={form.ca}
                onChange={(v) => setForm({ ...form, ca: v })}
              />
            </FormField>
            <FormField label="Marge (CFA)">
              <NumberInput
                value={form.marge}
                onChange={(v) => setForm({ ...form, marge: v })}
              />
            </FormField>
          </div>

          <FormField label="Statut" required>
            <Select
              value={form.statut}
              onChange={(v) => setForm({ ...form, statut: v })}
              options={STATUTS}
            />
          </FormField>

          <div className="pt-2 flex gap-2">
            <button
              disabled={(!editId && !CAN_CREATE) || (editId && !CAN_UPDATE)}
              className={`px-4 py-2 rounded-xl border transition-all duration-200 font-semibold shadow ${
                (!editId && !CAN_CREATE) || (editId && !CAN_UPDATE)
                  ? "bg-gray-200 text-gray-500 border-gray-200 cursor-not-allowed"
                  : "bg-orange-600 text-white border-orange-600 hover:bg-orange-500 hover:scale-105"
              }`}
            >
              {editId ? "Mettre à jour" : "Enregistrer"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(emptyDeal);
                setEditId("");
              }}
              className="px-4 py-2 rounded-xl bg-white text-black border border-black/10 hover:bg-orange-50 transition-all duration-200 shadow"
            >
              Réinitialiser
            </button>
          </div>
        </form>

        {/* TABLE */}
        <div className="lg:col-span-2 space-y-3 animate-fade-in" style={{animationDelay: '0.2s'}}>
          <h3 className="text-base font-semibold text-black">
            Liste des Deals — {state.selectedSemestre}
          </h3>
          <DataTablePro columns={columns} rows={dealsOfSemestre} />
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
