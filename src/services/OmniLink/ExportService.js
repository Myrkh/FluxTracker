import ExcelJS from 'exceljs';

export const ExportService = {
  async toExcel(records) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'INS Database - Artelia';
    const ws = workbook.addWorksheet('EXCHANGE');

    const columns = [
      { header: 'REV', key: 'rev', width: 13 },
      { header: 'TAG', key: 'tag', width: 15 },
      { header: 'SERVICE', key: 'service', width: 24 },
      { header: 'FUNCTION', key: 'function', width: 18 },
      { header: 'SUB_FUNCTION', key: 'sub_function', width: 18 },
      { header: 'LOC', key: 'loc', width: 6 },
      { header: 'NAME_LOC', key: 'name_loc', width: 15 },
      { header: 'LOOP_TYPE', key: 'loop_type', width: 8 },
      { header: 'SYSTEM', key: 'system', width: 10 },
      { header: 'NUM', key: 'num', width: 5 },
      { header: 'SEC', key: 'sec', width: 10 },
      { header: 'SEND_TO', key: 'send_to', width: 12 },
      { header: 'SIG', key: 'sig', width: 8 },
      { header: 'ALIM', key: 'alim', width: 6 },
      { header: 'ISOLATOR', key: 'isolator', width: 14 },
      { header: 'LIGHTNING', key: 'lightning', width: 10 },
      { header: 'I/O_CARD_TYPE', key: 'io_card_type', width: 8 },
      { header: 'MARSH_CABINET', key: 'marsh_cabinet', width: 14 },
      { header: 'SYSTEM_CABINET', key: 'system_cabinet', width: 14 },
      { header: 'RACK', key: 'rack', width: 10 },
      { header: 'SLOT', key: 'slot', width: 10 },
      { header: 'I/O_ADDRESS', key: 'io_address', width: 12 },
      { header: 'JB_TAG', key: 'jb_tag', width: 16 },
      { header: 'LOOP_DWG', key: 'loop_dwg', width: 20 },
      { header: 'JB_DWG', key: 'jb_dwg', width: 20 },
      { header: 'NET_TYPE', key: 'net_type', width: 10 },
      { header: 'NET_DB_REF', key: 'net_db_ref', width: 20 },
      { header: 'OBS_INS', key: 'obs_ins', width: 40 },
      { header: 'OBS_WIR', key: 'obs_wir', width: 40 },
      { header: 'OBS_GEN', key: 'obs_gen', width: 40 },
    ];
    ws.columns = columns;

    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00375A' } };
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 28;

    records.forEach(r => ws.addRow(r));

    ws.eachRow((row, idx) => {
      if (idx > 1 && idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7FF' } };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `INS_Export_Artelia_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
};
