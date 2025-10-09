// src/schemas/dealSchema.js
// mapping des entêtes attendues -> clés internes
export const DEAL_HEADERS = {
  "projet": "projet",
  "client": "client",
  "secteur": "secteur",
  "date de création": "dateCreation",
  "date de creation": "dateCreation",
  "datecreation": "dateCreation",
  "type de deal": "typeDeal",
  "typedeal": "typeDeal",
  "commercial": "commercial",
  "support av": "supportAV",
  "supportav": "supportAV",
  "semestre": "semestre",
  "ca": "ca",
  "chiffre d'affaire (cfa)": "ca",
  "chiffre d’affaire (cfa)": "ca",
  "marge": "marge",
  "marge (cfa)": "marge",
  "statut": "statut",
  "date dernière modification": "dateDerniereModif",
  "datedernieremodif": "dateDerniereModif",
};

export function normalizeDealRow(rawLowerObj) {
  const out = {};
  for (const [k, v] of Object.entries(rawLowerObj)) {
    const key = DEAL_HEADERS[k.trim().toLowerCase()];
    if (key) out[key] = v;
  }
  return out;
}

// champs minimum utiles pour créer un deal
export function validateDeal(obj) {
  const required = ["projet", "client", "secteur", "semestre", "ca", "marge", "statut"];
  const missing = required.filter((k) => !obj[k] && obj[k] !== 0);
  return { ok: missing.length === 0, missing };
}
