// ═══════════════════════════════════════════════════════════════════════════
// OmniLink - Cable Book Export Service
// Export Excel professionnel pour les 3 carnets de câbles
// ═══════════════════════════════════════════════════════════════════════════

import ExcelJS from 'exceljs';

export const CableBookExportService = {
  /**
   * Exporter le carnet UNITÉ
   */
  async exportUnit(records) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OmniLink - Artelia';
    const ws = workbook.addWorksheet('Carnet Unité');

    // Colonnes
    ws.columns = [
      { header: 'TAG', key: 'tag', width: 15 },
      { header: 'TYPE CÂBLE', key: 'cable_type', width: 20 },
      { header: 'JB TAG', key: 'jb_tag', width: 15 },
      { header: 'BORNE', key: 'terminal', width: 10 },
      { header: 'OBSERVATIONS', key: 'obs', width: 30 },
    ];

    // Style header
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00375A' } };
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 30;

    // Données
    records.forEach(r => ws.addRow(r));

    // Alternate rows
    ws.eachRow((row, idx) => {
      if (idx > 1 && idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7FF' } };
      }
    });

    return workbook;
  },

  /**
   * Exporter le carnet LOCAL TECHNIQUE
   */
  async exportLocal(records) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OmniLink - Artelia';
    const ws = workbook.addWorksheet('Carnet Local Technique');

    // Colonnes
    ws.columns = [
      { header: 'TAG', key: 'tag', width: 15 },
      { header: 'BN TAG', key: 'bn_tag', width: 15 },
      { header: 'BORNE', key: 'terminal', width: 10 },
      { header: 'TYPE CÂBLE', key: 'cable_type', width: 20 },
      { header: 'AFFECTATION', key: 'affectation', width: 20 },
      { header: 'OBSERVATIONS', key: 'obs', width: 30 },
    ];

    // Style header
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00375A' } };
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 30;

    // Données
    records.forEach(r => ws.addRow(r));

    // Alternate rows
    ws.eachRow((row, idx) => {
      if (idx > 1 && idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7FF' } };
      }
    });

    return workbook;
  },

  /**
   * Exporter le carnet MULTICONDUCTEUR
   */
  async exportMulticonductor(records) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OmniLink - Artelia';
    const ws = workbook.addWorksheet('Carnet Multiconducteur');

    // Colonnes
    ws.columns = [
      { header: 'TAG BJ', key: 'jb_tag', width: 15 },
      { header: 'LIEU', key: 'location', width: 20 },
      { header: 'TYPE MULTICONDUCTEUR', key: 'multiconductor_type', width: 25 },
      { header: 'TENANT', key: 'from_point', width: 20 },
      { header: 'ABOUTISSANT', key: 'to_point', width: 20 },
      { header: 'OBSERVATIONS', key: 'obs', width: 30 },
    ];

    // Style header
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00375A' } };
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 30;

    // Données
    records.forEach(r => ws.addRow(r));

    // Alternate rows
    ws.eachRow((row, idx) => {
      if (idx > 1 && idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7FF' } };
      }
    });

    return workbook;
  },

  /**
   * Télécharger le fichier Excel
   */
  async downloadExcel(workbook, filename) {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  /**
   * Export complet (les 3 carnets dans un seul fichier)
   */
  async exportAll(unitRecords, localRecords, multiRecords) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'OmniLink - Artelia';

    // Sheet 1: Unité
    const wsUnit = workbook.addWorksheet('Unité');
    wsUnit.columns = [
      { header: 'TAG', key: 'tag', width: 15 },
      { header: 'TYPE CÂBLE', key: 'cable_type', width: 20 },
      { header: 'JB TAG', key: 'jb_tag', width: 15 },
      { header: 'BORNE', key: 'terminal', width: 10 },
    ];
    wsUnit.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsUnit.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00375A' } };
    wsUnit.getRow(1).height = 30;
    unitRecords.forEach(r => wsUnit.addRow(r));

    // Sheet 2: Local Technique
    const wsLocal = workbook.addWorksheet('Local Technique');
    wsLocal.columns = [
      { header: 'TAG', key: 'tag', width: 15 },
      { header: 'BN TAG', key: 'bn_tag', width: 15 },
      { header: 'BORNE', key: 'terminal', width: 10 },
      { header: 'TYPE CÂBLE', key: 'cable_type', width: 20 },
      { header: 'AFFECTATION', key: 'affectation', width: 20 },
    ];
    wsLocal.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsLocal.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00375A' } };
    wsLocal.getRow(1).height = 30;
    localRecords.forEach(r => wsLocal.addRow(r));

    // Sheet 3: Multiconducteur
    const wsMulti = workbook.addWorksheet('Multiconducteur');
    wsMulti.columns = [
      { header: 'TAG BJ', key: 'jb_tag', width: 15 },
      { header: 'LIEU', key: 'location', width: 20 },
      { header: 'TYPE MULTI', key: 'multiconductor_type', width: 25 },
      { header: 'TENANT', key: 'from_point', width: 20 },
      { header: 'ABOUTISSANT', key: 'to_point', width: 20 },
    ];
    wsMulti.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsMulti.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00375A' } };
    wsMulti.getRow(1).height = 30;
    multiRecords.forEach(r => wsMulti.addRow(r));

    return workbook;
  }
};
