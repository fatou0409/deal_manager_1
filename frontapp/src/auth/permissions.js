// src/auth/permissions.js

// Libellés FR (utilisables dans l'UI)
export const ROLES = {
  ADMIN: "ADMIN",
  MANAGER: "MANAGER",
  BD: "BD",
  BUSINESS_DEVELOPER: "BD",   // ⬅️ AJOUTER CETTE LIGNE
  GUEST: "GUEST"
};

// Libellés français pour affichage
export const ROLE_LABELS = {
  ADMIN: "Administrateur",
  MANAGER: "Manager",
  BD: "Business Developer",
  GUEST: "Invité"
};

// --- Normalisation des rôles ----------------------------------------------
// On accepte à la fois les codes ("ADMIN","BD","GUEST") et les libellés FR.
const ROLE_ALIASES = {
  ADMIN: "ADMIN",
  Administrateur: "ADMIN",
  MANAGER: "MANAGER",
  Manager: "MANAGER",
  "Business Developer": "BD",
  BD: "BD",
  Invité: "GUEST",
  GUEST: "GUEST",
};

function normalizeRole(role) {
  if (!role) return null;
  return ROLE_ALIASES[role] || null;
}

// --- Droits par rôle (canonique) ------------------------------------------
const abilitiesByCanonicalRole = {
  ADMIN: ["*"],

  MANAGER: [
    "dashboard:read",
    "deal:read",
    "deal:create",
    "deal:update",
    "deal:delete",
    "deal:export",
    "deal:import",
    "visit:read",
    "visit:create",
    "visit:update",
    "visit:delete",
    "visit:export",
    "visit:import",
    "objectives:update",
  ],

  BD: [
    "dashboard:read",
    "deal:read",
    "deal:create",
    "deal:update",
    "deal:delete",
    "deal:export",
    "deal:import",
    "visit:read",
    "visit:create",
    "visit:update",
    "visit:delete",
    "visit:export",
    "visit:import",
    "objectives:update",
  ],

  GUEST: [
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
