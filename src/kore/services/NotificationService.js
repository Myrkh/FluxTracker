// ═══════════════════════════════════════════════════════════════════════════
// KORE — NotificationService
// Crée les notifications in-app et déclenche l'Edge Function pour les emails
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from '../../lib/supabase';

// ── Matching nom → user_id ───────────────────────────────────────────────
/**
 * Cherche le user_id d'un utilisateur par son nom complet (profiles.full_name).
 * Correspondance exacte d'abord, puis insensible à la casse.
 * Retourne null si pas de correspondance — silencieux, non-bloquant.
 */
async function findUserIdByName(fullName) {
  if (!fullName) return null;
  try {
    // Exact match
    const { data: exact } = await supabase
      .from('profiles')
      .select('id')
      .eq('full_name', fullName)
      .maybeSingle();

    if (exact) return exact.id;

    // Case-insensitive fallback
    const { data: ilike } = await supabase
      .from('profiles')
      .select('id')
      .ilike('full_name', fullName.trim())
      .maybeSingle();

    return ilike?.id || null;
  } catch {
    return null;
  }
}

/**
 * Récupère l'email d'un user depuis auth.users via la fonction RPC
 * (ou depuis profiles si email y est stocké)
 */
async function findEmailByUserId(userId) {
  if (!userId) return null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .maybeSingle();
    return data?.email || null;
  } catch {
    return null;
  }
}

// ── Création d'une notification in-app ──────────────────────────────────
async function createNotification({ userId, type, title, message, docNumber, docId, btNumber }) {
  if (!userId) return; // silencieux si pas de user trouvé
  try {
    await supabase.from('kore_notifications').insert({
      user_id:    userId,
      type,
      title,
      message,
      doc_number: docNumber || null,
      doc_id:     docId     || null,
      bt_number:  btNumber  || null,
    });
  } catch (err) {
    console.warn('[KORE] NotificationService: insert failed', err);
  }
}

// ── Email de notification signature via Supabase Edge Function ───────────
async function sendSignatureEmail({ toEmail, toName, senderName, docNumber, subject, message }) {
  if (!toEmail) return;
  try {
    // On réutilise l'Edge Function send-bt-email en mode "notification signature"
    // En passant docs vide et storagePath null → l'EF envoie juste l'email texte
    await supabase.functions.invoke('send-signature-notif', {
      body: { toEmail, toName, senderName, docNumber, subject, message },
    });
  } catch (err) {
    console.warn('[KORE] NotificationService: signature email failed', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API PUBLIQUE
// ═══════════════════════════════════════════════════════════════════════════

export const NotificationService = {

  /**
   * Appelé à la création d'un document avec des signataires définis.
   * Notifie le Rédacteur que c'est à lui de signer en premier.
   */
  async onDocumentCreated({ doc, revision, currentUserName }) {
    const redacteurName = revision?.redacteur;
    if (!redacteurName) return;

    const userId = await findUserIdByName(redacteurName);
    await createNotification({
      userId,
      type:      'SIGNATURE_PENDING',
      title:     'Document à signer',
      message:   `${doc.doc_number} attend votre signature en tant que Rédacteur.`,
      docNumber: doc.doc_number,
      docId:     doc.id,
    });
  },

  /**
   * Appelé après chaque signature.
   * Détermine la prochaine étape et notifie la bonne personne.
   */
  async onDocumentSigned({ doc, revision, signedRole, signerName }) {
    const roles = [
      { key: 'REDACTEUR',    name: revision?.redacteur,    label: 'Rédacteur' },
      { key: 'VERIFICATEUR', name: revision?.verificateur, label: 'Vérificateur' },
      { key: 'APPROBATEUR',  name: revision?.approbateur,  label: 'Approbateur' },
    ];

    const sigs     = revision?.kore_signatures || [];
    const signedKeys = sigs.filter(s => s.signed_at).map(s => s.role);

    // Cas 1 : Rédacteur vient de signer → notifier Vérificateur
    if (signedRole === 'REDACTEUR') {
      const next = roles.find(r => r.key === 'VERIFICATEUR');
      if (next?.name) {
        const userId = await findUserIdByName(next.name);
        await createNotification({
          userId,
          type:      'SIGNATURE_PENDING',
          title:     'Document à vérifier',
          message:   `${doc.doc_number} a été signé par le Rédacteur (${signerName}) et attend votre vérification.`,
          docNumber: doc.doc_number,
          docId:     doc.id,
        });
      }
    }

    // Cas 2 : Vérificateur vient de signer → notifier Approbateur
    if (signedRole === 'VERIFICATEUR') {
      const next = roles.find(r => r.key === 'APPROBATEUR');
      if (next?.name) {
        const userId = await findUserIdByName(next.name);
        await createNotification({
          userId,
          type:      'SIGNATURE_PENDING',
          title:     'Document à approuver',
          message:   `${doc.doc_number} a été vérifié par ${signerName} et attend votre approbation.`,
          docNumber: doc.doc_number,
          docId:     doc.id,
        });
      }
    }

    // Cas 3 : Tous les rôles définis ont signé → notifier tout le monde
    const definedRoles  = roles.filter(r => !!r.name);
    const allSigned     = definedRoles.every(r => signedKeys.includes(r.key) || r.key === signedRole);

    if (allSigned && definedRoles.length > 0) {
      for (const role of definedRoles) {
        const userId = await findUserIdByName(role.name);
        await createNotification({
          userId,
          type:      'VALIDATION_COMPLETE',
          title:     'Validation complète',
          message:   `${doc.doc_number} a été signé par tous les intervenants. Document prêt pour diffusion.`,
          docNumber: doc.doc_number,
          docId:     doc.id,
        });
      }
    }
  },

  /**
   * Appelé après la création d'un BT.
   * Upload le ZIP, envoie email au destinataire, notifie l'émetteur.
   */
  async onBtCreated({ btData, snapDocs, zipBlob, user, profile }) {
    const { bt_number, recipient_email, recipient_name } = btData;
    let storagePath = null;

    // ── 1. Upload ZIP dans Supabase Storage ─────────────────────────────
    try {
      storagePath = `${user.id}/${bt_number}_Artelia.zip`;
      const { error: uploadError } = await supabase.storage
        .from('kore-bt-zips')
        .upload(storagePath, zipBlob, {
          contentType: 'application/zip',
          upsert:       true,
        });
      if (uploadError) throw uploadError;
    } catch (err) {
      console.error('[KORE] NotificationService: ZIP upload failed', err);
      // Non-bloquant — on continue quand même
      storagePath = null;
    }

    // ── 2. Notification in-app pour l'émetteur ───────────────────────────
    const senderName = profile?.full_name || user?.email || 'Vous';
    await createNotification({
      userId:    user.id,
      type:      'BT_SENT',
      title:     `${bt_number} émis`,
      message:   storagePath
        ? `${bt_number} (${snapDocs.length} doc${snapDocs.length > 1 ? 's' : ''}) envoyé à ${recipient_name || recipient_email}.`
        : `${bt_number} créé — envoi email échoué (vérifiez Storage).`,
      btNumber:  bt_number,
    });

    // ── 3. Appel Edge Function → email destinataire + URL signée ────────
    if (storagePath && recipient_email) {
      try {
        await supabase.functions.invoke('send-bt-email', {
          body: {
            btNumber:       bt_number,
            recipientEmail: recipient_email,
            recipientName:  recipient_name || recipient_email,
            senderName:     senderName,
            senderEmail:    user?.email,
            storagePath,
            docs: snapDocs.map(d => ({
              doc_number: d.doc_number,
              doc_title:  d.doc_title,
              revision:   d.revision,
              status:     d.status,
            })),
            // Notification in-app déjà créée ci-dessus
            notifyUserIds: [],
          },
        });
      } catch (err) {
        console.error('[KORE] NotificationService: Edge Function call failed', err);
      }
    }
  },
};
