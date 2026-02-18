// ═══════════════════════════════════════════════════════════════════════════
// OmniLink - Cable Types Constants
// Types de câbles standards pour les carnets
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Types de câbles standards Artelia
 * Utilisés dans les dropdowns des carnets de câbles
 */
export const STANDARD_CABLE_TYPES = {
  TERRAIN: [
    { value: '01IP09EGFA', label: '01IP09EGFA — Câble 2×1.5mm² armé feuillard', armored: true },
    { value: '2x1,5 FRN1X1G1', label: '2x1,5 FRN1X1G1 — Câble armé 2×1.5mm² FR', armored: true },
    { value: '3x1,5 FRN1X1G1', label: '3x1,5 FRN1X1G1 — Câble armé 3×1.5mm² FR', armored: true },
    { value: '2×0.5mm² TC', label: '2×0.5mm² TC — Thermocouple blindé', armored: false },
  ],
  LOCAL_TECH: [
    { value: '01IP09EGSF', label: '01IP09EGSF — Câble 2×1.5mm² sans feuillard', armored: false },
    { value: '2x1,5 FR1N1X1G1', label: '2x1,5 FR1N1X1G1 — Câble SF 2×1.5mm² FR', armored: false },
    { value: '2×0.5mm² TC', label: '2×0.5mm² TC — Thermocouple blindé', armored: false },
  ],
  MULTICONDUCTOR: [
    { value: '27IP09EGFA', label: '27IP09EGFA — Multiconducteur 54 paires', pairs: 54 },
    { value: '27IP09EGFB', label: '27IP09EGFB — Multiconducteur 27 paires', pairs: 27 },
    { value: '27IP09EGFC', label: '27IP09EGFC — Multiconducteur 19 paires', pairs: 19 },
  ]
};

/**
 * Tous les types de câbles (terrain + local tech)
 */
export const ALL_CABLE_TYPES = [
  ...STANDARD_CABLE_TYPES.TERRAIN,
  ...STANDARD_CABLE_TYPES.LOCAL_TECH.filter(
    lt => !STANDARD_CABLE_TYPES.TERRAIN.some(t => t.value === lt.value)
  )
];

/**
 * Helper : Convertir JB_TAG en BN_TAG
 * Exemple: 510BJ1000 → 510BN1000
 */
export function convertJBtoBN(jbTag) {
  if (!jbTag) return '';
  return jbTag.replace(/BJ/gi, 'BN');
}

/**
 * Helper : Extraire le système automate depuis io_address
 * Exemple: "AUT39 R1S2V11" → "AUT39"
 */
export function extractAutomateSystem(ioAddress) {
  if (!ioAddress) return '';
  const match = ioAddress.match(/^([A-Z0-9]+)/);
  return match ? match[1] : '';
}
