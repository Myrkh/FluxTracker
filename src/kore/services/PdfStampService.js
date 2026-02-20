// ═══════════════════════════════════════════════════════════════════════════
// KORE — PdfStampService
// Appose un tampon d'authenticite sur la 1ere page d'un PDF
// Pour les non-PDF : genere un certificat PDF accompagnateur
// Utilise pdf-lib (client-side, pas de serveur)
// npm install pdf-lib
// ═══════════════════════════════════════════════════════════════════════════

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// ── Couleurs Artelia ──────────────────────────────────────────────────────
const COLOR_NAVY  = rgb(0 / 255,  61 / 255,  92 / 255);   // #003D5C
const COLOR_TEAL  = rgb(0 / 255, 155 / 255, 164 / 255);   // #009BA4
const COLOR_WHITE = rgb(1, 1, 1);
const COLOR_LIGHT = rgb(0.95, 0.98, 1);
const COLOR_GRAY  = rgb(0.5, 0.5, 0.5);
const COLOR_GREEN = rgb(0.05, 0.65, 0.45);

const STAMP_MARGIN = 20;

// ── Helpers ASCII-safe ────────────────────────────────────────────────────
// WinAnsi (StandardFonts de pdf-lib) ne supporte PAS les caracteres Unicode
// (accents, tirets cadratins, checkmarks...).
// Toutes les strings passees a drawText() doivent etre ASCII pur (0x00-0x7E).

/** Supprime les accents et remplace les caracteres non-ASCII par leur equivalent */
function toAscii(str) {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // supprime diacritiques (accents)
    .replace(/\u2014/g, '-')           // tiret cadratin -> tiret
    .replace(/\u2013/g, '-')           // tiret demi-cadratin -> tiret
    .replace(/\u00b7/g, '-')           // point median -> tiret
    .replace(/\u2019/g, "'")           // apostrophe courbe -> apostrophe droite
    .replace(/\u00e9/g, 'e')           // e accent -> e (fallback si NFD rate)
    .replace(/[^\x00-\x7E]/g, '');     // supprime tout le reste
}

/** Tronque a maxLen caracteres (apres toAscii) */
function trunc(str, maxLen) {
  const s = toAscii(str);
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '.' : s;
}

// ── Construction des lignes de signatures ─────────────────────────────────
function buildSigLines(revision) {
  if (!revision) return [];

  const sigs  = revision.kore_signatures || [];
  const roles = [
    { key: 'REDACTEUR',    label: 'Redacteur',    name: revision.redacteur    },
    { key: 'VERIFICATEUR', label: 'Verificateur', name: revision.verificateur },
    { key: 'APPROBATEUR',  label: 'Approbateur',  name: revision.approbateur  },
  ];

  return roles
    .filter(r => !!r.name)
    .map(r => {
      const sig = sigs.find(s => s.role === r.key);
      // Cle courte : 8 derniers chars du user_id UUID (ex: "a3f2b1c4")
      // Affichee a cote du nom comme identifiant de non-repudiation interne
      const signingKey = sig?.user_id
        ? sig.user_id.replace(/-/g, '').slice(-8).toUpperCase()
        : null;
      return {
        label:      r.label,
        name:       toAscii(r.name),
        signed:     !!sig,
        signingKey,
        signedAt: sig?.signed_at
          ? toAscii(new Date(sig.signed_at).toLocaleDateString('fr-FR'))
          : null,
      };
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// STAMP — Tampon sur la 1ere page d'un PDF
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Appose le tampon KORE sur la premiere page d'un PDF existant.
 * @param {ArrayBuffer} pdfBytes
 * @param {object}      doc
 * @param {object}      revision  (avec kore_signatures[])
 * @returns {Promise<Uint8Array>}
 */
export async function stampPdf(pdfBytes, doc, revision) {
  const pdfDoc    = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font      = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontR     = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const firstPage = pdfDoc.getPages()[0];
  const { width } = firstPage.getSize();

  const sigLines = buildSigLines(revision);
  const stampH   = 80 + Math.max(sigLines.length, 1) * 16;
  const stampW   = width - STAMP_MARGIN * 2;
  const stampX   = STAMP_MARGIN;
  const stampY   = STAMP_MARGIN;

  // Fond du tampon
  firstPage.drawRectangle({
    x: stampX, y: stampY, width: stampW, height: stampH,
    color: COLOR_LIGHT, borderColor: COLOR_NAVY, borderWidth: 1.5, opacity: 0.96,
  });

  // Barre de titre navy
  firstPage.drawRectangle({
    x: stampX, y: stampY + stampH - 22, width: stampW, height: 22,
    color: COLOR_NAVY, opacity: 0.97,
  });

  // Titre — ASCII pur obligatoire
  firstPage.drawText('KORE - Document Authentifie - Artelia Group', {
    x: stampX + 8, y: stampY + stampH - 15,
    size: 8, font, color: COLOR_WHITE,
  });

  // N° document
  firstPage.drawText(toAscii(doc.doc_number), {
    x: stampX + 8, y: stampY + stampH - 36,
    size: 10, font, color: COLOR_NAVY,
  });

  // Revision + statut
  const revLabel = `Rev. ${toAscii(revision?.revision || doc.current_revision)}  |  ${toAscii(revision?.status || doc.current_status)}`;
  firstPage.drawText(revLabel, {
    x: stampX + 8, y: stampY + stampH - 50,
    size: 8, font: fontR, color: COLOR_GRAY,
  });

  // Date export
  const exportDate = toAscii(
    new Date().toLocaleDateString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  );
  firstPage.drawText(`Exporte le ${exportDate}`, {
    x: stampX + stampW - 150, y: stampY + stampH - 36,
    size: 7, font: fontR, color: COLOR_GRAY,
  });

  // SHA-256
  if (revision?.file_hash) {
    firstPage.drawText('SHA-256 :', {
      x: stampX + 8, y: stampY + stampH - 64,
      size: 7, font, color: COLOR_TEAL,
    });
    firstPage.drawText(revision.file_hash.toUpperCase(), {
      x: stampX + 52, y: stampY + stampH - 64,
      size: 7, font: fontR, color: COLOR_GRAY,
    });
  }

  // Ligne separatrice
  const sepY = stampY + stampH - 74;
  firstPage.drawLine({
    start: { x: stampX + 8, y: sepY },
    end:   { x: stampX + stampW - 8, y: sepY },
    thickness: 0.5, color: COLOR_TEAL, opacity: 0.4,
  });

  // ── Signatures ───────────────────────────────────────────────────────────
  // Indicateurs VISUELS uniquement — zero caractere Unicode dans drawText
  // Pastille verte + croix vectorielle  = signe
  // Pastille grise + tiret vectoriel    = en attente
  sigLines.forEach((sig, i) => {
    const lineY = sepY - 14 - i * 16;

    // Pastille coloree
    firstPage.drawCircle({
      x: stampX + 16, y: lineY + 4, size: 5,
      color: sig.signed ? COLOR_GREEN : COLOR_GRAY,
    });

    // Tiret horizontal (visible sur les deux etats)
    firstPage.drawLine({
      start: { x: stampX + 13, y: lineY + 4 },
      end:   { x: stampX + 19, y: lineY + 4 },
      thickness: 1.5, color: COLOR_WHITE,
    });

    // Trait vertical additionnel si signe → forme une croix
    if (sig.signed) {
      firstPage.drawLine({
        start: { x: stampX + 16, y: lineY + 1.5 },
        end:   { x: stampX + 16, y: lineY + 6.5 },
        thickness: 1.5, color: COLOR_WHITE,
      });
    }

    // Role
    firstPage.drawText(`${sig.label} :`, {
      x: stampX + 26, y: lineY + 1,
      size: 7, font, color: COLOR_NAVY,
    });

    // Nom (toAscii applique dans buildSigLines)
    firstPage.drawText(trunc(sig.name, 22), {
      x: stampX + 88, y: lineY + 1,
      size: 7, font: sig.signed ? font : fontR,
      color: sig.signed ? COLOR_NAVY : COLOR_GRAY,
    });

    // Cle de signature courte — identifiant de non-repudiation
    if (sig.signed && sig.signingKey) {
      firstPage.drawText(`[${sig.signingKey}]`, {
        x: stampX + 88 + 22 * 4.2, y: lineY + 1,
        size: 6, font: fontR, color: COLOR_TEAL,
      });
    }

    // Date ou "En attente" — ASCII pur
    firstPage.drawText(sig.signedAt || 'En attente', {
      x: stampX + stampW - 60, y: lineY + 1,
      size: 7, font: fontR,
      color: sig.signedAt ? COLOR_TEAL : COLOR_GRAY,
    });
  });

  return pdfDoc.save();
}

// ═══════════════════════════════════════════════════════════════════════════
// CERTIFICAT — PDF accompagnateur pour les fichiers non-PDF
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Genere un certificat PDF autonome (pour DWG, DOCX, XLSX, etc.)
 * @param {object} doc
 * @param {object} revision  (avec kore_signatures[])
 * @returns {Promise<Uint8Array>}
 */
export async function generateCertificate(doc, revision) {
  const pdfDoc = await PDFDocument.create();
  const page   = pdfDoc.addPage([595, 420]);   // A5 paysage
  const font   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontR  = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const { width, height } = page.getSize();

  const sigLines = buildSigLines(revision);
  const PAD = 40;

  // Background
  page.drawRectangle({ x: 0, y: 0, width, height, color: COLOR_LIGHT });

  // Header
  page.drawRectangle({ x: 0, y: height - 50, width, height: 50, color: COLOR_NAVY });
  page.drawText('KORE - Certificat Authenticite', {
    x: PAD, y: height - 34, size: 14, font, color: COLOR_WHITE,
  });
  page.drawText('Artelia Group - Usage interne', {
    x: width - 190, y: height - 30, size: 9, font: fontR, color: COLOR_WHITE, opacity: 0.7,
  });

  // N° + titre document
  page.drawText(toAscii(doc.doc_number), {
    x: PAD, y: height - 80, size: 18, font, color: COLOR_NAVY,
  });
  page.drawText(trunc(doc.title, 52), {
    x: PAD, y: height - 100, size: 10, font: fontR, color: COLOR_GRAY,
  });

  // Tableau infos
  const infoY = height - 130;
  const rows = [
    ['Revision',   toAscii(revision?.revision || doc.current_revision)],
    ['Statut',     toAscii(revision?.status   || doc.current_status)],
    ['Discipline', toAscii(doc.discipline_code || '-')],
    ['Affaire',    toAscii(doc.project_number  || '-')],
    ['Export',     toAscii(new Date().toLocaleDateString('fr-FR'))],
  ];

  rows.forEach(([label, value], i) => {
    page.drawText(`${label} :`, {
      x: PAD, y: infoY - i * 18, size: 8, font, color: COLOR_NAVY,
    });
    page.drawText(value, {
      x: PAD + 80, y: infoY - i * 18, size: 8, font: fontR, color: COLOR_GRAY,
    });
  });

  // SHA-256
  if (revision?.file_hash) {
    const hashY = infoY - rows.length * 18 - 12;
    page.drawRectangle({
      x: PAD, y: hashY - 6, width: width / 2 - PAD - 10, height: 22,
      color: rgb(0, 0.04, 0.08), opacity: 0.06,
    });
    page.drawText('SHA-256 :', {
      x: PAD + 6, y: hashY + 2, size: 7, font, color: COLOR_TEAL,
    });
    // Afficher en deux lignes si hash trop long
    const hash = revision.file_hash.toUpperCase();
    page.drawText(hash.slice(0, 32), {
      x: PAD + 6, y: hashY - 9, size: 7, font: fontR, color: COLOR_GRAY,
    });
    if (hash.length > 32) {
      page.drawText(hash.slice(32), {
        x: PAD + 6, y: hashY - 19, size: 7, font: fontR, color: COLOR_GRAY,
      });
    }
  }

  // Separateur vertical
  page.drawLine({
    start: { x: width / 2, y: height - 60 },
    end:   { x: width / 2, y: 40 },
    thickness: 0.8, color: COLOR_TEAL, opacity: 0.3,
  });

  // Colonne signatures
  const sigX = width / 2 + 10;
  page.drawText('SIGNATURES', {
    x: sigX, y: height - 80, size: 9, font, color: COLOR_NAVY,
  });

  if (sigLines.length === 0) {
    page.drawText('Aucun signataire defini', {
      x: sigX, y: height - 100, size: 8, font: fontR, color: COLOR_GRAY,
    });
  } else {
    sigLines.forEach((sig, i) => {
      const lineY = height - 102 - i * 38;

      page.drawText(sig.label.toUpperCase(), {
        x: sigX, y: lineY, size: 7, font, color: COLOR_TEAL,
      });
      page.drawText(trunc(sig.name, 22), {
        x: sigX, y: lineY - 12, size: 10,
        font: sig.signed ? font : fontR,
        color: sig.signed ? COLOR_NAVY : COLOR_GRAY,
      });

      // Cle courte sur la meme ligne que le nom
      if (sig.signed && sig.signingKey) {
        page.drawText(`[${sig.signingKey}]`, {
          x: sigX, y: lineY - 22, size: 7, font: fontR, color: COLOR_TEAL,
        });
      }

      // ASCII pur — pas de tiret cadratin, pas d'accent
      const statusText = sig.signed
        ? `Signe le ${sig.signedAt}`
        : 'En attente de signature';
      page.drawText(statusText, {
        x: sigX, y: lineY - 24, size: 8, font: fontR,
        color: sig.signed ? COLOR_GREEN : COLOR_GRAY,
      });
    });
  }

  // Footer
  page.drawRectangle({ x: 0, y: 0, width, height: 30, color: COLOR_NAVY, opacity: 0.08 });
  page.drawText('Ce certificat atteste l authenticite du document KORE - Artelia Industrie - Non diffusable', {
    x: PAD, y: 10, size: 7, font: fontR, color: COLOR_GRAY,
  });

  return pdfDoc.save();
}

// ═══════════════════════════════════════════════════════════════════════════
// POINT D'ENTREE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detecte PDF vs autre, prepare le(s) fichier(s) a telecharger.
 * @param {ArrayBuffer|null} fileBytes
 * @param {string}           fileName
 * @param {object}           doc
 * @param {object}           revision
 * @returns {Promise<{ bytes: Uint8Array, name: string }[]>}
 */
export async function prepareDownload(fileBytes, fileName, doc, revision) {
  const ext     = fileName?.split('.').pop()?.toLowerCase();
  const results = [];

  if (ext === 'pdf' && fileBytes) {
    const stamped = await stampPdf(fileBytes, doc, revision);
    results.push({
      bytes: stamped,
      name:  fileName.replace(/\.pdf$/i, '_KORE.pdf'),
    });
  } else {
    if (fileBytes) {
      results.push({ bytes: new Uint8Array(fileBytes), name: fileName });
    }
    const certBytes = await generateCertificate(doc, revision);
    const safeDocNum = toAscii(doc.doc_number);
    const safeRev    = toAscii(revision?.revision || doc.current_revision);
    results.push({
      bytes: certBytes,
      name:  `${safeDocNum}_rev${safeRev}_CERTIFICAT.pdf`,
    });
  }

  return results;
}