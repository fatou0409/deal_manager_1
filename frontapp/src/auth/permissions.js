// Libellés FR (utilisables dans l'UI)
export const ROLES = {
  ADMIN: "ADMIN", // Garde les clés canoniques
  MANAGER: "MANAGER",
  BUSINESS_DEVELOPER: "BUSINESS_DEVELOPER",
  GUEST: "GUEST"
};

// Libellés français pour affichage
export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  BUSINESS_DEVELOPER: "Business Developer",
  GUEST: "Invité"
};

// --- Normalisation des rôles ----------------------------------------------
// On accepte à la fois les codes ("ADMIN","BD","GUEST") et les libellés FR.
const ROLE_ALIASES = {
  Administrateur: "ADMIN",
  Manager: "MANAGER",
  "Business Developer": "BUSINESS_DEVELOPER",
  Invité: "GUEST",
  // Ajout des clés canoniques pour l'auto-mapping
  ...ROLES
};

function normalizeRole(role) {
  if (!role) return null;
  return ROLE_ALIASES[role] || null;
}

// --- Droits par rôle (canonique) ------------------------------------------
const abilitiesByCanonicalRole = {
  [ROLES.ADMIN]: ["*"],

  [ROLES.MANAGER]: [
    "dashboard:read",

    "deal:read","deal:create","deal:update","deal:delete",
    "deal:export","deal:import",

    "visit:read","visit:create","visit:update","visit:delete",
    "visit:export","visit:import",

    // Pipes — AJOUT des droits complets (incluant delete/import/export)
    "pipe:read","pipe:create","pipe:update","pipe:delete",
    "pipe:export","pipe:import",

    "objectives:update",
  ],

  [ROLES.BUSINESS_DEVELOPER]: [
    "dashboard:read",

    "deal:read","deal:create","deal:update","deal:delete",
    "deal:export","deal:import",

    "visit:read","visit:create","visit:update","visit:delete",
    "visit:export","visit:import",

    // Pipes — autoriser delete pour cohérence avec le back (DELETE_OWN_PIPE)
    "pipe:read","pipe:create","pipe:update","pipe:delete",
    // (import/export pipes peuvent rester managés par Manager si tu préfères)
    "pipe:import",
    "pipe:export",
  ],

  [ROLES.GUEST]: [
    "dashboard:read",
    "deal:read",
    "visit:read",
  ],
};

/**
 * Vérifie si un rôle a une capacité donnée (ex: canRole("Business Developer","deal:update"))
 */
export function canRole(role, ability) {
  const canon = normalizeRole(role);
  if (!canon) return false;
  if (typeof ability !== "string" || !ability.includes(":")) return false;

  const list = abilitiesByCanonicalRole[canon] || [];
  if (list.includes("*")) return true;
  if (list.includes(ability)) return true;

  const [domain] = ability.split(":");
  return list.includes(`${domain}:*`);
}

/** Retourne la liste des abilities d’un rôle (copie) */
export function abilitiesFor(role) {
  const canon = normalizeRole(role);
  return [...(abilitiesByCanonicalRole[canon] || [])];
}

/** Tous les rôles (libellés FR pour affichage) */
export const ALL_ROLES = Object.values(ROLES);
