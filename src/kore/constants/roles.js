// ═══════════════════════════════════════════════════════════════════════════
// KORE — Rôles et permissions
// Source de vérité unique pour les droits par rôle
// ═══════════════════════════════════════════════════════════════════════════

export const KORE_ROLES = {
  CHEF_PROJET:  { label: 'Chef de Projet',          color: 'bg-[#003D5C] text-white',    short: 'CP' },
  DOC_CONTROL:  { label: 'Doc Control',              color: 'bg-[#009BA4] text-white',    short: 'DC' },
  INGENIEUR:    { label: 'Ingénieur de Projet',      color: 'bg-blue-600 text-white',     short: 'IP' },
  VERIFICATEUR: { label: 'Vérificateur / Approbateur', color: 'bg-amber-500 text-white', short: 'VA' },
  LECTEUR:      { label: 'Lecture seule',            color: 'bg-gray-400 text-white',     short: 'LS' },
};

export const ROLE_OPTIONS = Object.entries(KORE_ROLES).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

// ── Matrice des permissions ───────────────────────────────────────────────
const PERMISSIONS = {
  // Documents
  'doc:read':       ['CHEF_PROJET', 'DOC_CONTROL', 'INGENIEUR', 'VERIFICATEUR', 'LECTEUR'],
  'doc:create':     ['CHEF_PROJET', 'DOC_CONTROL', 'INGENIEUR'],
  'doc:update':     ['CHEF_PROJET', 'DOC_CONTROL', 'INGENIEUR'],
  'doc:delete':     ['CHEF_PROJET'],
  'doc:import':     ['CHEF_PROJET', 'DOC_CONTROL'],
  // Signatures
  'sig:create':     ['CHEF_PROJET', 'DOC_CONTROL', 'INGENIEUR', 'VERIFICATEUR'],
  // Transmissions
  'bt:read':        ['CHEF_PROJET', 'DOC_CONTROL', 'INGENIEUR', 'VERIFICATEUR', 'LECTEUR'],
  'bt:create':      ['CHEF_PROJET', 'DOC_CONTROL'],
  // Équipe
  'team:read':      ['CHEF_PROJET', 'DOC_CONTROL', 'INGENIEUR', 'VERIFICATEUR', 'LECTEUR'],
  'team:manage':    ['CHEF_PROJET'],
  // Projet
  'project:update': ['CHEF_PROJET'],
  'project:delete': ['CHEF_PROJET'],
};

/**
 * Vérifie si un rôle a une permission donnée
 * @param {string} role - ex: 'INGENIEUR'
 * @param {string} permission - ex: 'doc:create'
 * @returns {boolean}
 */
export function can(role, permission) {
  if (!role || !permission) return false;
  return PERMISSIONS[permission]?.includes(role) ?? false;
}

/**
 * Hook-friendly : retourne toutes les permissions d'un rôle
 */
export function getPermissions(role) {
  return Object.entries(PERMISSIONS)
    .filter(([, roles]) => roles.includes(role))
    .map(([perm]) => perm);
}
