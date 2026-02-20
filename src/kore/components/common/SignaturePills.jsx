// ═══════════════════════════════════════════════════════════════════════════
// KORE — SignaturePills
// 3 pastilles compactes R / V / A affichant l'état de signature d'une révision
// Cliquables si l'utilisateur connecté peut signer
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { Check, PenLine } from 'lucide-react';

const ROLES = [
  { key: 'REDACTEUR',    short: 'R', label: 'Rédacteur'    },
  { key: 'VERIFICATEUR', short: 'V', label: 'Vérificateur' },
  { key: 'APPROBATEUR',  short: 'A', label: 'Approbateur'  },
];

/**
 * @param {object}   revision    - révision courante (avec kore_signatures[])
 * @param {function} onSign      - (role) => void — déclenche SignatureModal
 * @param {boolean}  hasFile     - la révision a-t-elle un fichier attaché ?
 */
export function SignaturePills({ revision, onSign, hasFile }) {
  if (!revision) return <span className="text-gray-300 text-xs">—</span>;

  const signatures = revision.kore_signatures || [];

  // Détermine quels rôles sont "actifs" (nom renseigné sur la révision)
  const activeRoles = ROLES.filter(r => {
    if (r.key === 'REDACTEUR')    return !!revision.redacteur;
    if (r.key === 'VERIFICATEUR') return !!revision.verificateur;
    if (r.key === 'APPROBATEUR')  return !!revision.approbateur;
    return false;
  });

  if (activeRoles.length === 0) {
    return <span className="text-gray-300 text-xs">—</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {activeRoles.map(({ key, short, label }) => {
        const sig = signatures.find(s => s.role === key);
        const isSigned = !!sig;

        // Nom planifié sur la révision
        const plannedName = key === 'REDACTEUR'
          ? revision.redacteur
          : key === 'VERIFICATEUR'
          ? revision.verificateur
          : revision.approbateur;

        const tooltipSigned = `${label} : ${sig?.full_name || plannedName}\n${sig?.signed_at
          ? new Date(sig.signed_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })
          : ''}`;
        const tooltipUnsigned = `${label} : ${plannedName} — Signature manquante\nCliquez pour signer`;

        return (
          <button
            key={key}
            onClick={!isSigned ? () => onSign(key, revision) : undefined}
            title={isSigned ? tooltipSigned : tooltipUnsigned}
            disabled={isSigned}
            className={`
              inline-flex items-center justify-center gap-0.5
              w-7 h-5 rounded text-[10px] font-bold transition-all select-none
              ${isSigned
                ? 'bg-emerald-100 text-emerald-700 cursor-default'
                : hasFile
                  ? 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
              }
            `}
          >
            {isSigned
              ? <><Check className="w-2.5 h-2.5" />{short}</>
              : <><PenLine className="w-2.5 h-2.5" />{short}</>
            }
          </button>
        );
      })}
    </div>
  );
}
