// ═══════════════════════════════════════════════════════════════════════════
// KORE — useTransmissions Hook
// CRUD des bordereaux de transmission BT-x
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase }      from '../../lib/supabase';
import { buildBtNumber } from '../../services/Kore/BtxService';

export function useTransmissions(userId) {
  const [transmissions, setTransmissions] = useState([]);
  const [loading, setLoading]             = useState(true);

  // ── Chargement ──────────────────────────────────────────────────────────
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

  // ── Prochain numéro BT ──────────────────────────────────────────────────
  const nextBtNumber = useCallback(() => {
    const seq = transmissions.length + 1;
    return buildBtNumber(seq);
  }, [transmissions]);

  // ── Créer un bordereau ──────────────────────────────────────────────────
  const createTransmission = useCallback(async (btData, selectedDocs) => {
    try {
      // 1. Insérer le bordereau
      const { data: bt, error: btError } = await supabase
        .from('kore_transmissions')
        .insert({
          bt_number:       btData.bt_number,
          project_number:  btData.project_number || null,
          recipient_name:  btData.recipient_name || null,
          recipient_email: btData.recipient_email || null,
          notes:           btData.notes || null,
          doc_count:       selectedDocs.length,
          user_id:         userId,
        })
        .select()
        .single();

      if (btError) throw btError;

      // 2. Insérer les lignes de documents (snapshot au moment de la transmission)
      const docRows = selectedDocs.map(d => {
        const rev = d.kore_revisions
          ?.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
        const sigs = rev?.kore_signatures || [];

        return {
          transmission_id:  bt.id,
          document_id:      d.id,
          doc_number:       d.doc_number,
          doc_title:        d.title,
          revision:         d.current_revision,
          status:           d.current_status,
          file_hash:        rev?.file_hash    || null,
          sig_redacteur:    rev?.redacteur    || null,
          sig_verificateur: rev?.verificateur || null,
          sig_approbateur:  rev?.approbateur  || null,
          sig_count:        sigs.length,
        };
      });

      const { error: docsError } = await supabase
        .from('kore_transmission_docs')
        .insert(docRows);

      if (docsError) throw docsError;

      // 3. Mise à jour locale
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
