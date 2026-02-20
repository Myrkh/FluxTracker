// ═══════════════════════════════════════════════════════════════════════════
// KORE — KoreExportService
// Export Excel du registre documentaire
// Pattern ExcelJS — même style que OmniLink ExportService
// ═══════════════════════════════════════════════════════════════════════════

import ExcelJS from 'exceljs';
import { DISCIPLINES, STATUTS, STATUTS_EMIS } from '../constants';

const ARTELIA_NAVY   = '00375A';  // navy Artelia
const ARTELIA_TEAL   = '009BA4';  // teal KORE
const ARTELIA_WHITE  = 'FFFFFF';
const ARTELIA_LIGHT  = 'E8F4F8';  // fond lignes alternées

/** Style entête colonne */
const headerStyle = (bgHex) => ({
  font:      { bold: true, color: { argb: ARTELIA_WHITE }, size: 10, name: 'Arial' },
  fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: bgHex } },
  alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
  border: {
    bottom: { style: 'thin', color: { argb: 'CCCCCC' } },
    right:  { style: 'thin', color: { argb: ARTELIA_WHITE } },
  },
});

/** Style cellule données */
const cellStyle = (isEven, isBold = false) => ({
  font:      { size: 9, name: 'Arial', bold: isBold },
  fill:      { type: 'pattern', pattern: 'solid', fgColor: { argb: isEven ? ARTELIA_LIGHT : ARTELIA_WHITE } },
  alignment: { vertical: 'middle', wrapText: false },
  border:    { bottom: { style: 'hair', color: { argb: 'E0E0E0' } } },
});

/**
 * Exporte le registre KORE vers Excel (3 onglets)
 * @param {object[]} docs - documents avec kore_revisions[]
 * @returns {Promise<void>} télécharge directement
 */
export async function exportRegistreExcel(docs) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator  = 'KORE — Artelia Group';
  workbook.created  = new Date();
  workbook.modified = new Date();

  // ── ONGLET 1 : Registre complet ─────────────────────────────────────────
  const wsReg = workbook.addWorksheet('Registre', {
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });

  const colsReg = [
    { header: 'N° Document',      key: 'doc_number',      width: 30 },
    { header: 'Désignation',      key: 'title',           width: 45 },
    { header: 'Disc.',            key: 'discipline_code', width: 8  },
    { header: 'Affaire',          key: 'project_number',  width: 12 },
    { header: 'Rév.',             key: 'current_revision',width: 6  },
    { header: 'Statut',           key: 'current_status',  width: 10 },
    { header: 'Rédacteur',        key: 'redacteur',       width: 18 },
    { header: 'Vérificateur',     key: 'verificateur',    width: 18 },
    { header: 'Date création',    key: 'created_at',      width: 14 },
  ];
  wsReg.columns = colsReg;

  // Ligne titre
  wsReg.spliceRows(1, 0, []);
  const titleRow = wsReg.getRow(1);
  titleRow.getCell(1).value = `REGISTRE DOCUMENTAIRE KORE — Artelia Group — Export du ${new Date().toLocaleDateString('fr-FR')}`;
  titleRow.getCell(1).font  = { bold: true, size: 12, color: { argb: ARTELIA_NAVY } };
  wsReg.mergeCells(1, 1, 1, colsReg.length);
  titleRow.height = 20;

  // Entêtes
  const headerRow = wsReg.getRow(2);
  colsReg.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = col.header;
    Object.assign(cell, headerStyle(ARTELIA_NAVY));
  });
  headerRow.height = 24;

  // Données
  docs.forEach((doc, idx) => {
    const row = wsReg.getRow(idx + 3);
    const isEven = idx % 2 === 0;
    const data = [
      doc.doc_number,
      doc.title,
      doc.discipline_code,
      doc.project_number,
      doc.current_revision,
      doc.current_status,
      doc.redacteur || '',
      doc.verificateur || '',
      doc.created_at ? new Date(doc.created_at).toLocaleDateString('fr-FR') : '',
    ];
    data.forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      Object.assign(cell, cellStyle(isEven, i === 0));
    });
    row.height = 16;
  });

  // Freeze + filtre
  wsReg.views = [{ state: 'frozen', ySplit: 2 }];
  wsReg.autoFilter = { from: 'A2', to: `I2` };

  // ── ONGLET 2 : Historique des révisions ──────────────────────────────────
  const wsHist = workbook.addWorksheet('Historique révisions');
  const colsHist = [
    { header: 'N° Document',  key: 'doc_number', width: 30 },
    { header: 'Désignation',  key: 'title',      width: 40 },
    { header: 'Révision',     key: 'revision',   width: 8  },
    { header: 'Statut',       key: 'status',     width: 10 },
    { header: 'Date',         key: 'rev_date',   width: 12 },
    { header: 'Auteur',       key: 'author',     width: 18 },
    { header: 'Objet',        key: 'changes',    width: 40 },
    { header: 'Fichier',      key: 'file_name',  width: 25 },
    { header: 'Hash (SHA-256)',key: 'file_hash',  width: 20 },
  ];
  wsHist.columns = colsHist;

  const histTitleRow = wsHist.getRow(1);
  histTitleRow.getCell(1).value = `HISTORIQUE DES RÉVISIONS — Artelia Group — ${new Date().toLocaleDateString('fr-FR')}`;
  histTitleRow.getCell(1).font  = { bold: true, size: 12, color: { argb: ARTELIA_NAVY } };
  wsHist.mergeCells(1, 1, 1, colsHist.length);
  histTitleRow.height = 20;

  const histHeaderRow = wsHist.getRow(2);
  colsHist.forEach((col, i) => {
    const cell = histHeaderRow.getCell(i + 1);
    cell.value = col.header;
    Object.assign(cell, headerStyle(ARTELIA_TEAL));
  });
  histHeaderRow.height = 24;

  let histRowIdx = 3;
  docs.forEach(doc => {
    const revisions = doc.kore_revisions || [];
    const sorted = [...revisions].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    sorted.forEach((rev, idx) => {
      const row = wsHist.getRow(histRowIdx);
      const isEven = histRowIdx % 2 === 0;
      [
        doc.doc_number,
        doc.title,
        rev.revision,
        rev.status,
        rev.revision_date || (rev.created_at ? new Date(rev.created_at).toLocaleDateString('fr-FR') : ''),
        rev.author,
        rev.changes || '',
        rev.file_name || '',
        rev.file_hash ? rev.file_hash.slice(0, 16) + '...' : '',
      ].forEach((val, i) => {
        const cell = row.getCell(i + 1);
        cell.value = val;
        Object.assign(cell, cellStyle(isEven, i === 0 && idx === 0));
      });
      row.height = 16;
      histRowIdx++;
    });
  });

  wsHist.views = [{ state: 'frozen', ySplit: 2 }];

  // ── ONGLET 3 : Statistiques ──────────────────────────────────────────────
  const wsStats = workbook.addWorksheet('Statistiques');

  const statsTitleRow = wsStats.getRow(1);
  statsTitleRow.getCell(1).value = `STATISTIQUES DOCUMENTAIRES — ${new Date().toLocaleDateString('fr-FR')}`;
  statsTitleRow.getCell(1).font  = { bold: true, size: 12, color: { argb: ARTELIA_NAVY } };
  wsStats.mergeCells(1, 1, 1, 4);
  statsTitleRow.height = 20;

  // Stats globales
  const globalStats = [
    ['Total documents',       docs.length],
    ['Documents émis (IFC/ASB/FIN)', docs.filter(d => STATUTS_EMIS.includes(d.current_status)).length],
    ['Disciplines',           new Set(docs.map(d => d.discipline_code)).size],
    ['Affaires',              new Set(docs.map(d => d.project_number)).size],
    ['Avec fichier attaché',  docs.filter(d => d.kore_revisions?.some(r => r.file_path)).length],
  ];

  const statsHeaderRow = wsStats.getRow(2);
  ['Indicateur', 'Valeur', '', ''].forEach((h, i) => {
    const cell = statsHeaderRow.getCell(i + 1);
    cell.value = h;
    if (i < 2) Object.assign(cell, headerStyle(ARTELIA_NAVY));
  });
  statsHeaderRow.height = 22;

  globalStats.forEach(([label, value], idx) => {
    const row = wsStats.getRow(idx + 3);
    row.getCell(1).value = label;
    row.getCell(1).font  = { size: 10, name: 'Arial' };
    row.getCell(2).value = value;
    row.getCell(2).font  = { size: 10, name: 'Arial', bold: true, color: { argb: ARTELIA_NAVY } };
    row.getCell(2).alignment = { horizontal: 'center' };
    row.height = 16;
  });

  // Par discipline
  const discMap = {};
  docs.forEach(d => { discMap[d.discipline_code] = (discMap[d.discipline_code] || 0) + 1; });
  const discEntries = Object.entries(discMap).sort((a, b) => b[1] - a[1]);

  wsStats.getRow(9).getCell(1).value = 'Par discipline';
  wsStats.getRow(9).getCell(1).font  = { bold: true, size: 11, color: { argb: ARTELIA_NAVY } };
  wsStats.getRow(9).height = 18;

  const discHeaderRow = wsStats.getRow(10);
  ['Code', 'Libellé', 'Nb docs', '% du total'].forEach((h, i) => {
    const cell = discHeaderRow.getCell(i + 1);
    cell.value = h;
    Object.assign(cell, headerStyle(ARTELIA_TEAL));
  });
  discHeaderRow.height = 20;

  discEntries.forEach(([code, count], idx) => {
    const row = wsStats.getRow(idx + 11);
    const isEven = idx % 2 === 0;
    [code, DISCIPLINES[code] || code, count, docs.length > 0 ? `${Math.round(count / docs.length * 100)}%` : '0%'].forEach((val, i) => {
      const cell = row.getCell(i + 1);
      cell.value = val;
      Object.assign(cell, cellStyle(isEven, i === 0));
    });
    row.height = 16;
  });

  wsStats.columns = [
    { width: 10 }, { width: 35 }, { width: 10 }, { width: 12 },
  ];

  // ── Téléchargement ────────────────────────────────────────────────────────
  const dateStr  = new Date().toISOString().slice(0, 10);
  const fileName = `KORE_Registre_Artelia_${dateStr}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href     = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
