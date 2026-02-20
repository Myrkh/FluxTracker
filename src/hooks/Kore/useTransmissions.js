// ═══════════════════════════════════════════════════════════════════════════
// KORE — useTransmissions Hook
// v4 : snapshot complet — signed_at + user_id par rôle
//      → tampon ZIP identique au tampon Registre
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase }      from '../../lib/supabase';
import { buildBtNumber } from '../../services/Kore/BtxService';

export function useTransmissions(userId) {
  const [transmissions, setTransmissions] = useState([]);
  const [loading, setLoading]             = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setTransmissions([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kore_transmissions')
        .select('*, kore_transmission_docs(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransmissions(data || []);
    } catch (err) {
      console.error('[KORE] useTransmissions load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const nextBtNumber = useCallback(() => {
    return buildBtNumber(transmissions.length + 1);
  }, [transmissions]);

  const createTransmission = useCallback(async (btData, selectedDocs) => {
    try {
      const { data: bt, error: btError } = await supabase
        .from('kore_transmissions')
        .insert({
          bt_number:       btData.bt_number,
          project_number:  btData.project_number  || null,
          recipient_name:  btData.recipient_name  || null,
          recipient_email: btData.recipient_email || null,
          notes:           btData.notes           || null,
          doc_count:       selectedDocs.length,
          user_id:         userId,
        })
        .select()
        .single();

      if (btError) throw btError;

      const docRows = selectedDocs.map(d => {
        const rev  = d.kore_revisions
          ?.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const sigs = rev?.kore_signatures || [];

        // Trouver la signature effective pour un rôle (null si pas encore signée)
        const sigFor = (role) => sigs.find(s => s.role === role && s.signed_at) || null;

        const sigR = sigFor('REDACTEUR');
        const sigV = sigFor('VERIFICATEUR');
        const sigA = sigFor('APPROBATEUR');

        return {
          transmission_id:  bt.id,
          document_id:      d.id,
          doc_number:       d.doc_number,
          doc_title:        d.title,
          revision:         d.current_revision,
          status:           d.current_status,
          // Intégrité + fichier
          file_hash:        rev?.file_hash || null,
          file_path:        rev?.file_path || null,
          file_name:        rev?.file_name || null,
          // Noms des signataires (définis dans le doc, indépendants des signatures)
          sig_redacteur:    rev?.redacteur    || null,
          sig_verificateur: rev?.verificateur || null,
          sig_approbateur:  rev?.approbateur  || null,
          sig_count:        sigs.length,
          // Dates réelles — null si pas encore signé
          sig_redacteur_signed_at:    sigR?.signed_at || null,
          sig_verificateur_signed_at: sigV?.signed_at || null,
          sig_approbateur_signed_at:  sigA?.signed_at || null,
          // User IDs — null si pas encore signé → clé [SIGNINGKEY] dans tampon
          sig_redacteur_user_id:    sigR?.user_id || null,
          sig_verificateur_user_id: sigV?.user_id || null,
          sig_approbateur_user_id:  sigA?.user_id || null,
        };
      });

      const { error: docsError } = await supabase
        .from('kore_transmission_docs')
        .insert(docRows);

      if (docsError) throw docsError;

      const newBt = { ...bt, kore_transmission_docs: docRows };
      setTransmissions(prev => [newBt, ...prev]);

      return { data: newBt, error: null };
    } catch (err) {
      console.error('[KORE] createTransmission error:', err);
      return { data: null, error: err };
    }
  }, [userId]);

  return {
    transmissions,
    loading,
    reload: load,
    nextBtNumber,
    createTransmission,
  };
}