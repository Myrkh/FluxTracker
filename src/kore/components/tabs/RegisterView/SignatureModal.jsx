// ═══════════════════════════════════════════════════════════════════════════
// KORE — SignatureModal
// Modal de confirmation de signature électronique interne
// L'identité est prise depuis la session Supabase — non saisie par l'utilisateur
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { X, PenLine, Shield, RefreshCw, FileText, AlertTriangle } from 'lucide-react';

const ROLE_LABELS = {
  REDACTEUR:    'Rédacteur',
  VERIFICATEUR: 'Vérificateur',
  APPROBATEUR:  'Approbateur',
};

const ROLE_COLORS = {
  REDACTEUR:    'text-blue-600 bg-blue-50 border-blue-200',
  VERIFICATEUR: 'text-violet-600 bg-violet-50 border-violet-200',
  APPROBATEUR:  'text-emerald-600 bg-emerald-50 border-emerald-200',
};

/**
 * @param {object}   doc      - document complet
 * @param {object}   revision - révision à signer
 * @param {string}   role     - 'REDACTEUR' | 'VERIFICATEUR' | 'APPROBATEUR'
 * @param {object}   user     - { id, email }
 * @param {object}   profile  - { full_name }
 * @param {function} onSign   - async ({ revisionId, documentId, revision, role, userId, fullName, docHash }) => { error }
 * @param {function} onClose
 * @param {function} notify
 */
export function SignatureModal({ doc, revision, role, user, profile, onSign, onClose, notify }) {
  const [loading, setLoading] = useState(false);

  const fullName  = profile?.full_name || user?.email || 'Utilisateur inconnu';
  const docHash   = revision?.file_hash || null;
  const colorCls  = ROLE_COLORS[role] || '';
  const roleLabel = ROLE_LABELS[role] || role;

  // Nom planifié pour ce rôle
  const plannedName = role === 'REDACTEUR'
    ? revision?.redacteur
    : role === 'VERIFICATEUR'
    ? revision?.verificateur
    : revision?.approbateur;

  const handleSign = async () => {
    setLoading(true);
    const { error } = await onSign({
      revisionId:  revision.id,
      documentId:  doc.id,
      revision:    revision.revision,
      role,
      userId:      user.id,
      fullName,
      docHash,
    });
    setLoading(false);

    if (error) {
      notify('❌ Erreur : ' + (error.message || 'Signature impossible'), 'error');
      return;
    }
    notify(`✅ Document signé en tant que ${roleLabel}`);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#009BA4]" />
            <h3 className="font-bold text-[#003D5C] text-base">Signature électronique</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Rôle */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold mb-5 border ${colorCls}`}>
          <PenLine className="w-3.5 h-3.5" />
          Signature en tant que {roleLabel}
        </div>

        {/* Infos document */}
        <div className="bg-[#003D5C]/5 rounded-xl p-4 mb-5 space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-[#009BA4] mt-0.5 shrink-0" />
            <div>
              <p className="font-mono font-bold text-[#003D5C] text-xs">{doc.doc_number}</p>
              <p className="text-gray-600 text-xs mt-0.5">{doc.title}</p>
            </div>
          </div>
          <div className="flex justify-between text-xs pt-1 border-t border-[#003D5C]/10">
            <span className="text-gray-500">Révision</span>
            <span className="font-mono font-bold">{revision?.revision}</span>
          </div>
          {docHash && (
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 flex items-center gap-1">
                <Shield className="w-3 h-3" /> Hash fichier
              </span>
              <span className="font-mono text-gray-400">{docHash.slice(0, 16)}…</span>
            </div>
          )}
        </div>

        {/* Identité du signataire */}
        <div className="bg-[#009BA4]/8 border border-[#009BA4]/20 rounded-xl p-4 mb-5">
          <p className="text-xs text-gray-500 mb-1">Votre identité (compte Supabase)</p>
          <p className="font-semibold text-[#003D5C]">{fullName}</p>
          <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
          {plannedName && plannedName.toLowerCase() !== fullName.toLowerCase() && (
            <div className="flex items-start gap-1.5 mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>
                Le rôle {roleLabel} était prévu pour <strong>{plannedName}</strong>.
                Vous signez avec votre propre compte.
              </span>
            </div>
          )}
        </div>

        {/* Mention légale */}
        <p className="text-xs text-gray-400 mb-5 text-center">
          En cliquant sur Signer, vous attestez avoir {roleLabel === 'Rédacteur' ? 'rédigé' : roleLabel === 'Vérificateur' ? 'vérifié' : 'approuvé'} ce document.
          Cette action est horodatée et liée à votre compte Artelia.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSign} disabled={loading}
            className="flex-1 bg-[#003D5C] hover:bg-[#002A42] text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin" />Signature...</>
              : <><PenLine className="w-4 h-4" />Signer</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
