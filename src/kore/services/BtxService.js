// ═══════════════════════════════════════════════════════════════════════════
// KORE — BtxService
// Génération du bordereau de transmission PDF (BT-x)
// F6 du Brainstorm KORE — client-side via pdf-lib
// ═══════════════════════════════════════════════════════════════════════════

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const COLOR_NAVY  = rgb(0 / 255, 61 / 255,  92 / 255);
const COLOR_TEAL  = rgb(0 / 255, 155 / 255, 164 / 255);
const COLOR_WHITE = rgb(1, 1, 1);
const COLOR_LIGHT = rgb(0.94, 0.98, 1);
const COLOR_GRAY  = rgb(0.45, 0.45, 0.45);
const COLOR_ROW_ALT = rgb(0.97, 0.99, 1);
const COLOR_GREEN   = rgb(0.05, 0.65, 0.45);

const PAD = 40;
const ROW_H = 22;

// ── Statut → couleur texte ────────────────────────────────────────────────
function statutColor(code) {
  const map = {
    IFC: COLOR_GREEN,
    IFR: rgb(0.9, 0.6, 0),
    IFA: rgb(0.9, 0.6, 0),
    ASB: rgb(0.2, 0.5, 0.9),
    FIN: rgb(0.3, 0.3, 0.3),
    PRE: COLOR_GRAY,
  };
  return map[code] || COLOR_GRAY;
}

/**
 * Génère le numéro BT formaté
 * @param {number} seq - séquence (ex: 3)
 * @returns {string}   - BT-2026-003
 */
export function buildBtNumber(seq) {
  const year = new Date().getFullYear();
  return `BT-${year}-${String(seq).padStart(3, '0')}`;
}

/**
 * Génère le PDF bordereau de transmission
 *
 * @param {object}   btData        - { bt_number, recipient_name, recipient_email, notes }
 * @param {object[]} selectedDocs  - documents sélectionnés avec leur révision courante
 * @param {object}   user          - { email }
 * @param {object}   profile       - { full_name }
 * @returns {Promise<Uint8Array>}
 */
export async function generateBordereauPdf(btData, selectedDocs, user, profile) {
  const pdfDoc = await PDFDocument.create();
  const font   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontR  = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // ── Format A4 paysage ───────────────────────────────────────────────────
  const PAGE_W = 842;
  const PAGE_H = 595;
  const CONTENT_W = PAGE_W - PAD * 2;
  const ROWS_PER_PAGE = Math.floor((PAGE_H - 200) / ROW_H);

  const addPage = () => {
    const p = pdfDoc.addPage([PAGE_W, PAGE_H]);
    p.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: rgb(0.99, 0.99, 1) });
    return p;
  };

  const emitDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 1 — Header + table des documents
  // ════════════════════════════════════════════════════════════════════════
  let page = addPage();

  // Header navy
  page.drawRectangle({ x: 0, y: PAGE_H - 70, width: PAGE_W, height: 70, color: COLOR_NAVY });

  // Titre gauche
  page.drawText('BORDEREAU DE TRANSMISSION', {
    x: PAD, y: PAGE_H - 28, size: 16, font, color: COLOR_WHITE,
  });
  page.drawText('Artelia Group · KORE Document Management', {
    x: PAD, y: PAGE_H - 46, size: 9, font: fontR, color: rgb(0.7, 0.85, 0.9),
  });

  // N° BT à droite
  page.drawText(btData.bt_number, {
    x: PAGE_W - 180, y: PAGE_H - 28, size: 20, font, color: COLOR_WHITE,
  });
  page.drawText(emitDate, {
    x: PAGE_W - 180, y: PAGE_H - 46, size: 9, font: fontR, color: rgb(0.7, 0.85, 0.9),
  });

  // ── Bloc infos émetteur / destinataire ───────────────────────────────────
  const infoY = PAGE_H - 90;
  const col1X = PAD;
  const col2X = PAGE_W / 2 + 10;

  // Émetteur
  page.drawText('ÉMETTEUR', { x: col1X, y: infoY, size: 7, font, color: COLOR_TEAL });
  page.drawText(profile?.full_name || user?.email || 'Artelia', {
    x: col1X, y: infoY - 14, size: 10, font, color: COLOR_NAVY,
  });
  page.drawText(user?.email || '', {
    x: col1X, y: infoY - 28, size: 8, font: fontR, color: COLOR_GRAY,
  });

  // Destinataire
  page.drawText('DESTINATAIRE', { x: col2X, y: infoY, size: 7, font, color: COLOR_TEAL });
  page.drawText(btData.recipient_name || '—', {
    x: col2X, y: infoY - 14, size: 10, font, color: COLOR_NAVY,
  });
  if (btData.recipient_email) {
    page.drawText(btData.recipient_email, {
      x: col2X, y: infoY - 28, size: 8, font: fontR, color: COLOR_GRAY,
    });
  }

  // Notes
  if (btData.notes) {
    page.drawText(`Note : ${btData.notes}`, {
      x: col1X, y: infoY - 48, size: 8, font: fontR, color: COLOR_GRAY,
    });
  }

  // Ligne séparatrice
  const tableTopY = infoY - (btData.notes ? 62 : 50);
  page.drawLine({
    start: { x: PAD, y: tableTopY }, end: { x: PAGE_W - PAD, y: tableTopY },
    thickness: 1, color: COLOR_TEAL, opacity: 0.4,
  });

  // ── En-tête de table ─────────────────────────────────────────────────────
  const headerY = tableTopY - ROW_H;
  page.drawRectangle({ x: PAD, y: headerY, width: CONTENT_W, height: ROW_H, color: COLOR_NAVY });

  const cols = [
    { x: PAD + 4,   w: 180, label: 'N° DOCUMENT'  },
    { x: PAD + 188, w: 220, label: 'DÉSIGNATION'  },
    { x: PAD + 412, w: 40,  label: 'DISC.'         },
    { x: PAD + 456, w: 30,  label: 'RÉV.'          },
    { x: PAD + 490, w: 48,  label: 'STATUT'        },
    { x: PAD + 542, w: 110, label: 'SIGNATAIRES'   },
    { x: PAD + 656, w: 100, label: 'SHA-256'       },
  ];

  cols.forEach(({ x, label }) => {
    page.drawText(label, {
      x, y: headerY + 7, size: 7, font, color: COLOR_WHITE,
    });
  });

  // ── Lignes de documents ──────────────────────────────────────────────────
  let currentY = headerY;
  let pageIndex = 0;

  for (let i = 0; i < selectedDocs.length; i++) {
    currentY -= ROW_H;

    // Nouvelle page si nécessaire
    if (currentY < 60) {
      pageIndex++;
      page = addPage();
      page.drawRectangle({ x: 0, y: PAGE_H - 30, width: PAGE_W, height: 30, color: COLOR_NAVY });
      page.drawText(`${btData.bt_number} · Suite (page ${pageIndex + 1})`, {
        x: PAD, y: PAGE_H - 19, size: 9, font, color: COLOR_WHITE,
      });

      // Ré-émettre l'en-tête
      currentY = PAGE_H - 50 - ROW_H;
      page.drawRectangle({ x: PAD, y: currentY, width: CONTENT_W, height: ROW_H, color: COLOR_NAVY });
      cols.forEach(({ x, label }) => {
        page.drawText(label, { x, y: currentY + 7, size: 7, font, color: COLOR_WHITE });
      });
      currentY -= ROW_H;
    }

    const d = selectedDocs[i];
    const rev = d.kore_revisions
      ?.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    const sigs = rev?.kore_signatures || [];

    // Fond alterné
    if (i % 2 === 0) {
      page.drawRectangle({ x: PAD, y: currentY, width: CONTENT_W, height: ROW_H, color: COLOR_ROW_ALT });
    }

    // N° document
    page.drawText(d.doc_number, {
      x: cols[0].x, y: currentY + 7, size: 7, font, color: COLOR_NAVY,
    });

    // Désignation (tronquée)
    const titleTrunc = (d.title || '').length > 38 ? d.title.slice(0, 35) + '…' : d.title;
    page.drawText(titleTrunc || '—', {
      x: cols[1].x, y: currentY + 7, size: 7, font: fontR, color: COLOR_GRAY,
    });

    // Discipline
    page.drawText(d.discipline_code || '—', {
      x: cols[2].x, y: currentY + 7, size: 7, font, color: COLOR_NAVY,
    });

    // Révision
    page.drawText(d.current_revision || '0', {
      x: cols[3].x, y: currentY + 7, size: 7, font, color: COLOR_GRAY,
    });

    // Statut
    page.drawText(d.current_status || '—', {
      x: cols[4].x, y: currentY + 7, size: 8, font,
      color: statutColor(d.current_status),
    });

    // Signataires (R V A)
    const sigSummary = [
      rev?.redacteur    ? `R:${rev.redacteur.split(' ').pop()}`    : null,
      rev?.verificateur ? `V:${rev.verificateur.split(' ').pop()}` : null,
      rev?.approbateur  ? `A:${rev.approbateur.split(' ').pop()}`  : null,
    ].filter(Boolean).join('  ');
    page.drawText(sigSummary || '—', {
      x: cols[5].x, y: currentY + 7, size: 6.5, font: fontR, color: COLOR_GRAY,
    });

    // SHA-256 (8 chars)
    const hash = rev?.file_hash;
    page.drawText(hash ? hash.slice(0, 16).toUpperCase() + '…' : '(sans fichier)', {
      x: cols[6].x, y: currentY + 7, size: 6, font: fontR,
      color: hash ? COLOR_TEAL : COLOR_GRAY,
    });
  }

  // ── Pied de tableau — total ───────────────────────────────────────────────
  currentY -= 4;
  page.drawLine({
    start: { x: PAD, y: currentY }, end: { x: PAGE_W - PAD, y: currentY },
    thickness: 0.5, color: COLOR_TEAL, opacity: 0.4,
  });
  page.drawText(`Total : ${selectedDocs.length} document${selectedDocs.length > 1 ? 's' : ''}`, {
    x: PAD, y: currentY - 14, size: 8, font, color: COLOR_NAVY,
  });

  // ── Footer toutes pages ───────────────────────────────────────────────────
  const allPages = pdfDoc.getPages();
  allPages.forEach((p, idx) => {
    p.drawLine({
      start: { x: PAD, y: 28 }, end: { x: PAGE_W - PAD, y: 28 },
      thickness: 0.5, color: COLOR_NAVY, opacity: 0.2,
    });
    p.drawText(
      `KORE · Bordereau de Transmission ${btData.bt_number} · Artelia Group · Confidentiel · Page ${idx + 1}/${allPages.length}`,
      { x: PAD, y: 14, size: 7, font: fontR, color: COLOR_GRAY }
    );
  });

  return pdfDoc.save();
}
