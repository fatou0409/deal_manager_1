// src/components/DealsFilters.jsx
export default function DealsFilters({
  value = {},
  onChange = () => {},
  secteurs = [],
  semestres = [],
  commerciaux = [],
  statuts = [],
  typesDeal = [],
}) {
  const v = value;

  const set = (k, val) => onChange({ ...v, [k]: val });

  return (
    <div className="rounded-2xl border border-black/10 bg-white p-3 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
      <div>
        <div className="text-xs text-black/60 mb-1">Sélecteur</div>
        <select
          value={v.secteur || ""}
          onChange={(e) => set("secteur", e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-orange-600"
        >
          <option value="">Tous secteurs</option>
          {secteurs.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <div className="text-xs text-black/60 mb-1">Semestre</div>
        <select
          value={v.semestre || ""}
          onChange={(e) => set("semestre", e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-orange-600"
        >
          <option value="">Tous semestres</option>
          {semestres.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <div className="text-xs text-black/60 mb-1">Statut</div>
        <select
          value={v.statut || ""}
          onChange={(e) => set("statut", e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-orange-600"
        >
          <option value="">Tous statuts</option>
          {statuts.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <div className="text-xs text-black/60 mb-1">Type de deal</div>
        <select
          value={v.typeDeal || ""}
          onChange={(e) => set("typeDeal", e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-orange-600"
        >
          <option value="">Tous types</option>
          {typesDeal.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div>
        <div className="text-xs text-black/60 mb-1">Commercial</div>
        <select
          value={v.commercial || ""}
          onChange={(e) => set("commercial", e.target.value)}
          className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none focus:ring-2 focus:ring-orange-600"
        >
          <option value="">Tous</option>
          {commerciaux.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  );
}
