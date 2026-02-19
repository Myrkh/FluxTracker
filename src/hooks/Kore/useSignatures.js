// ═══════════════════════════════════════════════════════════════════════════
// KORE — useSignatures Hook
// Gestion des signatures électroniques internes
// Utilise profiles.id (= auth.users.id) comme identifiant unique du signataire
// ═══════════════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Hook de signature — conçu pour s'utiliser avec useDocuments
 * onSignSuccess : callback pour rafraîchir les docs après signature
 *
 * @param {function} onSignSuccess - callback déclenché après signature réussie
 */
export function useSignatures(onSignSuccess) {
  /**
   * Signe une révision avec l'identité de l'utilisateur connecté
   *
   * @param {object} params
   * @param {string} params.revisionId   - UUID de la révision (kore_revisions.id)
   * @param {string} params.documentId   - UUID du document (kore_documents.id)
   * @param {string} params.revision     - Texte révision (ex: "0", "1")
   * @param {string} params.role         - 'REDACTEUR' | 'VERIFICATEUR' | 'APPROBATEUR'
   * @param {string} params.userId       - auth.uid() — identifiant Supabase
   * @param {string} params.fullName     - Nom complet depuis profiles.full_name
   * @param {string|null} params.docHash - SHA-256 du fichier attaché (ou null)
   * @returns {Promise<{error: Error|null}>}
   */
  const sign = useCallback(async ({ revisionId, documentId, revision, role, userId, fullName, docHash }) => {
    try {
      const { error } = await supabase
        .from('kore_signatures')
        .insert({
          revision_id: revisionId,
          document_id: documentId,
          revision,
          role,
          user_id:   userId,
          full_name: fullName,
          doc_hash:  docHash || null,
        });

      if (error) return { error };

      // Rafraîchit les docs pour mettre à jour les pastilles
      onSignSuccess?.();
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }, [onSignSuccess]);

  return { sign };
}
