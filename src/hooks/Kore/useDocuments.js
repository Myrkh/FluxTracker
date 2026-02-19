// ═══════════════════════════════════════════════════════════════════════════
// KORE — useDocuments Hook
// v2.2 : + downloadWithStamp (tampon authenticité PDF / certificat non-PDF)
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase }         from '../../lib/supabase';
import { hashFile }         from '../../services/Kore/HashService';
import { prepareDownload }  from '../../services/Kore/PdfStampService';

const STORAGE_BUCKET = 'kore-docs';

export function useDocuments(userId) {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setDocs([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kore_documents')
        .select('*, kore_revisions(*, kore_signatures(*))')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocs(data || []);
    } catch (err) {
      console.error('[KORE] useDocuments load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  // ── Créer un document ──────────────────────────────────────────────────
  const insertDoc = useCallback(async (docData) => {
    try {
      const { data, error } = await supabase
        .from('kore_documents')
        .insert({ ...docData, user_id: userId })
        .select('*, kore_revisions(*, kore_signatures(*))')
        .single();

      if (error) return { data: null, error };
      setDocs(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }, [userId]);

  // ── Ajouter une révision ───────────────────────────────────────────────
  const insertRevision = useCallback(async (docId, revData, file = null) => {
    try {
      let filePath = null;
      let fileHash = null;
      let fileSize = null;
      let fileName = null;

      if (file) {
        fileName = file.name;
        fileSize = file.size;
        fileHash = await hashFile(file);

        const doc = docs.find(d => d.id === docId);
        const safeDocNumber = doc?.doc_number?.replace(/[^a-zA-Z0-9-_]/g, '_') || docId;
        const ext = file.name.split('.').pop().toLowerCase();
        filePath = `${userId}/${safeDocNumber}_rev${revData.revision}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file, { upsert: true, contentType: file.type });

        if (uploadError) throw uploadError;
      }

      const { data: revDataResult, error: revError } = await supabase
        .from('kore_revisions')
        .insert({
          ...revData,
          document_id: docId,
          file_path:   filePath,
          file_hash:   fileHash,
          file_size:   fileSize,
          file_name:   fileName,
        })
        .select()
        .single();

      if (revError) throw revError;

      await supabase
        .from('kore_documents')
        .update({ current_revision: revData.revision, current_status: revData.status })
        .eq('id', docId);

      const revWithSigs = { ...revDataResult, kore_signatures: [] };

      setDocs(prev => prev.map(d =>
        d.id === docId
          ? {
              ...d,
              current_revision: revData.revision,
              current_status:   revData.status,
              kore_revisions:   [...(d.kore_revisions || []), revWithSigs],
            }
          : d
      ));

      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }, [userId, docs]);

  // ── Signer une révision ────────────────────────────────────────────────
  const signRevision = useCallback(async ({ revisionId, documentId, revision, role, userId: sigUserId, fullName, docHash }) => {
    try {
      const { data: sigData, error } = await supabase
        .from('kore_signatures')
        .insert({ revision_id: revisionId, document_id: documentId, revision, role, user_id: sigUserId, full_name: fullName, doc_hash: docHash || null })
        .select()
        .single();

      if (error) return { error };

      setDocs(prev => prev.map(doc => {
        if (doc.id !== documentId) return doc;
        return {
          ...doc,
          kore_revisions: (doc.kore_revisions || []).map(rev => {
            if (rev.id !== revisionId) return rev;
            return { ...rev, kore_signatures: [...(rev.kore_signatures || []), sigData] };
          }),
        };
      }));

      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }, []);

  // ── URL signée (lecture directe, sans tampon) ─────────────────────────
  const getFileUrl = useCallback(async (filePath) => {
    if (!filePath) return null;
    const { data } = await supabase.storage
      .from(STORAGE_BUCKET)
      .createSignedUrl(filePath, 3600);
    return data?.signedUrl || null;
  }, []);

  // ── Téléchargement authentifié avec tampon KORE ───────────────────────
  // Pour PDF : appose le tampon sur la 1ère page
  // Pour non-PDF : génère un certificat PDF accompagnateur
  const downloadWithStamp = useCallback(async (doc, revision) => {
    try {
      const filePath = revision?.file_path;
      let fileBytes  = null;

      if (filePath) {
        const url = await getFileUrl(filePath);
        if (!url) throw new Error('Fichier introuvable');
        const resp = await fetch(url);
        fileBytes  = await resp.arrayBuffer();
      }

      const files = await prepareDownload(
        fileBytes,
        revision?.file_name || `${doc.doc_number}.pdf`,
        doc,
        revision
      );

      // Télécharger tous les fichiers (1 ou 2)
      files.forEach(({ bytes, name }) => {
        const blob = new Blob([bytes], { type: 'application/pdf' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = name;
        a.click();
        URL.revokeObjectURL(url);
      });

      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }, [getFileUrl]);

  return {
    docs,
    loading,
    reload: load,
    insertDoc,
    insertRevision,
    signRevision,
    getFileUrl,
    downloadWithStamp,
  };
}