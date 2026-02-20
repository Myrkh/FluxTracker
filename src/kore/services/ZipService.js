// ═══════════════════════════════════════════════════════════════════════════
// KORE — ZipService
// v3 : snapshotToRevision ne met dans kore_signatures QUE les signatures
//      réellement effectuées (signed_at non null) + user_id pour [SIGNINGKEY]
//      → tampon ZIP identique au tampon Registre
// ═══════════════════════════════════════════════════════════════════════════

import JSZip from 'jszip';
import { generateBordereauPdf }          from './BtxService';
import { stampPdf, generateCertificate } from './PdfStampService';

function snapshotToDoc(snap) {
  return {
    doc_number:       snap.doc_number  || '',
    title:            snap.doc_title   || '',
    discipline_code:  snap.discipline  || '',
    project_number:   snap.project     || '',
    current_revision: snap.revision    || '',
    current_status:   snap.status      || '',
  };
}

/**
 * Reconstruit la révision depuis le snapshot.
 *
 * Règle clé : on n'inclut dans kore_signatures QUE les rôles réellement
 * signés (signed_at non null). C'est exactement ce que fait une vraie révision —
 * buildSigLines dans PdfStampService vérifie !!sig pour décider de la pastille.
 * Un signataire sans sig dans le tableau → pastille grise "En attente".
 */
function snapshotToRevision(snap) {
  const signatures = [];

  // N'ajouter une signature que si elle est effective (signed_at présent)
  if (snap.sig_redacteur_signed_at) {
    signatures.push({
      role:      'REDACTEUR',
      full_name: snap.sig_redacteur,
      signed_at: snap.sig_redacteur_signed_at,
      user_id:   snap.sig_redacteur_user_id || null,
    });
  }
  if (snap.sig_verificateur_signed_at) {
    signatures.push({
      role:      'VERIFICATEUR',
      full_name: snap.sig_verificateur,
      signed_at: snap.sig_verificateur_signed_at,
      user_id:   snap.sig_verificateur_user_id || null,
    });
  }
  if (snap.sig_approbateur_signed_at) {
    signatures.push({
      role:      'APPROBATEUR',
      full_name: snap.sig_approbateur,
      signed_at: snap.sig_approbateur_signed_at,
      user_id:   snap.sig_approbateur_user_id || null,
    });
  }

  return {
    revision:     snap.revision || '',
    status:       snap.status   || '',
    file_hash:    snap.file_hash || null,
    file_name:    snap.file_name || null,
    // Noms définis dans le doc (affichés même sans signature)
    redacteur:    snap.sig_redacteur    || null,
    verificateur: snap.sig_verificateur || null,
    approbateur:  snap.sig_approbateur  || null,
    // Uniquement les signatures effectives → même logique que Registre
    kore_signatures: signatures,
  };
}

/**
 * Génère le ZIP complet du Bordereau de Transmission
 *
 * @param {object}   btData      - { bt_number, recipient_name, recipient_email, notes }
 * @param {object[]} snapDocs    - lignes kore_transmission_docs
 * @param {object}   user        - { email }
 * @param {object}   profile     - { full_name }
 * @param {Function} getFileUrl  - async (filePath) => signedUrl | null
 * @param {Function} onProgress  - (pct: number, label: string) => void
 * @returns {Promise<Blob>}
 */
export async function generateBtZip(btData, snapDocs, user, profile, getFileUrl, onProgress = () => {}) {
  const zip    = new JSZip();
  const folder = zip.folder(btData.bt_number);
  const total  = snapDocs.length + 1;
  let   done   = 0;

  const progress = (label) => {
    done++;
    onProgress(Math.round((done / total) * 100), label);
  };

  // ── 1. Bordereau PDF ──────────────────────────────────────────────────
  onProgress(0, 'Generation du bordereau...');
  const bordereauBytes = await generateBordereauPdf(btData, snapDocs, user, profile);
  folder.file(`${btData.bt_number}_Bordereau.pdf`, bordereauBytes);
  progress('Bordereau genere');

  // ── 2. Fichiers documents ─────────────────────────────────────────────
  for (const snap of snapDocs) {
    const doc      = snapshotToDoc(snap);
    const revision = snapshotToRevision(snap);  // ← logique identique au Registre
    const ext      = snap.file_name?.split('.').pop()?.toLowerCase();
    const safeName = snap.doc_number.replace(/[^a-zA-Z0-9-_]/g, '_');

    onProgress(Math.round((done / total) * 100), `Traitement ${snap.doc_number}...`);

    if (snap.file_path) {
      let fileBytes = null;
      try {
        const url = await getFileUrl(snap.file_path);
        if (url) {
          const resp = await fetch(url);
          fileBytes  = await resp.arrayBuffer();
        }
      } catch (err) {
        console.warn(`[KORE] ZipService: impossible de charger ${snap.file_path}`, err);
      }

      if (ext === 'pdf' && fileBytes) {
        try {
          const stamped = await stampPdf(fileBytes, doc, revision);
          folder.file(`${safeName}_rev${snap.revision}_KORE.pdf`, stamped);
        } catch (err) {
          console.warn(`[KORE] ZipService: stamp echoue pour ${snap.doc_number}`, err);
          folder.file(`${safeName}_rev${snap.revision}_original.pdf`, fileBytes);
        }
      } else if (fileBytes) {
        folder.file(`${safeName}_rev${snap.revision}.${ext}`, fileBytes);
        try {
          const certBytes = await generateCertificate(doc, revision);
          folder.file(`${safeName}_rev${snap.revision}_CERTIFICAT.pdf`, certBytes);
        } catch (err) {
          console.warn(`[KORE] ZipService: certificat echoue pour ${snap.doc_number}`, err);
        }
      }
    } else {
      try {
        const certBytes = await generateCertificate(doc, revision);
        folder.file(`${safeName}_rev${snap.revision}_CERTIFICAT.pdf`, certBytes);
      } catch (err) {
        console.warn(`[KORE] ZipService: certificat sans fichier echoue pour ${snap.doc_number}`, err);
      }
    }

    progress(snap.doc_number);
  }

  // ── 3. ZIP ────────────────────────────────────────────────────────────
  onProgress(99, 'Compression...');
  const blob = await zip.generateAsync({
    type:               'blob',
    compression:        'DEFLATE',
    compressionOptions: { level: 6 },
  });

  onProgress(100, 'Termine');
  return blob;
}