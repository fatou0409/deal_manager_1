// src/utils/validators.js

// normalise: minuscule + trim + suppression espaces multiples
export function normalizeHeaderLabel(s) {
  return String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // retire accents
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * expected: string[] (labels attendus, ex: colonnes.map(c=>c.header))
 * found: string[] (labels trouvés dans le fichier importé)
 * -> compare en mode normalisé pour tolérer casse/accents/espaces
 */
export function validateHeaders(expected, found) {
  const exp = expected.map(normalizeHeaderLabel);
  const fnd = found.map(normalizeHeaderLabel);

  const missing = exp.filter(h => !fnd.includes(h));
  const extra   = fnd.filter(h => !exp.includes(h));

  return { ok: missing.length === 0, missing, extra };
}
