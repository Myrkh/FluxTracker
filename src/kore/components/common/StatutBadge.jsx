// ═══════════════════════════════════════════════════════════════════════════
// KORE — StatutBadge
// Badge coloré affichant le code statut HXAQ023
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { STATUT_COLORS, STATUTS } from '../../constants';

/**
 * @param {string} code - code statut (PRE, IFR, IFC...)
 * @param {boolean} showLabel - afficher le libellé complet
 */
export function StatutBadge({ code, showLabel = false }) {
  const colorClass = STATUT_COLORS[code] || 'bg-gray-100 text-gray-600';
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${colorClass}`}
      title={STATUTS[code] || code}
    >
      {code}
      {showLabel && <span className="ml-1 font-normal">{STATUTS[code]}</span>}
    </span>
  );
}
