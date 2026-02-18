import React from 'react';

export function LoopDiagramSVG({ record }) {
  const cableSpec = AutoFillService.getCableSpec(record.sig);
  const isSIS = record.loop_type === 'SIS';
  const isAnalog = record.sig?.startsWith('AI') || record.sig?.startsWith('AO');

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <span className="font-bold text-[#00375A]">{record.tag}</span>
          <span>—</span>
          <span>{record.service}</span>
          {isSIS && <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded">SIS</span>}
        </div>
        <div className="text-xs text-gray-400">Phase 3 : Export PDF/DXF à venir</div>
      </div>

      {/* SVG Canvas */}
      <svg viewBox="0 0 840 500" className="w-full" style={{ maxHeight: '500px' }}>
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="840" height="500" fill="url(#grid)" />

        {/* ── PROCESS PIPE ── */}
        <line x1="60" y1="80" x2="280" y2="80" stroke="#000" strokeWidth="4" />
        <polygon points="250,72 270,80 250,88" fill="#000" />
        <text x="170" y="65" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#333">{record.service || 'PROCESS'}</text>

        {/* ── INSTRUMENT (ISA circle) ── */}
        <line x1="170" y1="80" x2="170" y2="120" stroke="#000" strokeWidth="2" />
        <circle cx="170" cy="155" r="35" fill="white" stroke={isSIS ? '#DC2626' : '#000'} strokeWidth={isSIS ? 3 : 2} />
        {isSIS && <line x1="135" y1="155" x2="205" y2="155" stroke="#DC2626" strokeWidth="1.5" />}
        <text x="170" y="150" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#00375A">{record.tag}</text>
        <text x="170" y="167" textAnchor="middle" fontSize="9" fill="#666">{record.sig || ''}</text>

        {/* ── Instrument details ── */}
        <text x="220" y="130" fontSize="9" fill="#333">Function: {record.function || 'N/A'}</text>
        <text x="220" y="145" fontSize="9" fill="#666">Sub: {record.sub_function || 'N/A'}</text>
        <text x="220" y="160" fontSize="9" fill="#666">Loc: {record.loc || 'N/A'} {record.name_loc || ''}</text>

        {/* ── WIRING ── */}
        <line x1="170" y1="190" x2="170" y2="260"
          stroke="#000" strokeWidth="1.5"
          strokeDasharray={isAnalog ? 'none' : '6,4'} />
        {cableSpec && (
          <text x="185" y="230" fontSize="8" fill="#0091D5">{cableSpec.type}</text>
        )}
        {record.isolator && record.isolator !== 'NR' && (
          <>
            <rect x="150" y="225" width="40" height="16" rx="2" fill="#FFF7ED" stroke="#F59E0B" />
            <text x="170" y="236" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#B45309">{record.isolator?.replace('IS+GALV ', 'IS+G ')}</text>
          </>
        )}

        {/* ── JUNCTION BOX ── */}
        {record.jb_tag ? (
          <>
            <rect x="145" y="260" width="50" height="35" fill="white" stroke="#000" strokeWidth="2" />
            <line x1="145" y1="277" x2="195" y2="277" stroke="#000" strokeWidth="1" />
            <line x1="170" y1="260" x2="170" y2="295" stroke="#000" strokeWidth="1" />
            <text x="170" y="318" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#333">{record.jb_tag}</text>
            <text x="170" y="330" textAnchor="middle" fontSize="7" fill="#999">JB DWG: {record.jb_dwg || 'N/A'}</text>
          </>
        ) : (
          <text x="170" y="280" textAnchor="middle" fontSize="8" fill="#F59E0B">⚠ JB non définie</text>
        )}

        {/* ── CABLE from JB to Marshalling ── */}
        <line x1="170" y1={record.jb_tag ? 295 : 285} x2="170" y2="360"
          stroke="#000" strokeWidth="1.5" strokeDasharray={isAnalog ? 'none' : '6,4'} />
        {record.lightning && record.lightning !== 'NR' && (
          <>
            <text x="185" y="345" fontSize="7" fill="#7C3AED">⚡ {record.lightning}</text>
          </>
        )}

        {/* ── MARSH CABINET ── */}
        {record.marsh_cabinet && (
          <>
            <rect x="130" y="360" width="80" height="30" fill="#F8FAFC" stroke="#000" strokeWidth="1.5" rx="3" />
            <text x="170" y="380" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#333">{record.marsh_cabinet}</text>
            <text x="170" y="400" textAnchor="middle" fontSize="7" fill="#999">Arm. Raccordement</text>
          </>
        )}

        {/* ── I/O CARD ── */}
        <line x1="210" y1="375" x2="400" y2="375" stroke="#000" strokeWidth="1.5" />
        <rect x="400" y="355" width="120" height="40" fill="#EFF6FF" stroke="#00375A" strokeWidth="2" rx="4" />
        <text x="460" y="372" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#00375A">{record.system || 'SYSTEM'}</text>
        <text x="460" y="387" textAnchor="middle" fontSize="8" fill="#666">{record.io_address || 'No I/O'}</text>

        {/* I/O details */}
        <text x="535" y="355" fontSize="8" fill="#333">Cabinet: {record.system_cabinet || 'N/A'}</text>
        <text x="535" y="368" fontSize="8" fill="#333">Rack: {record.rack || 'N/A'} / Slot: {record.slot || 'N/A'}</text>
        <text x="535" y="381" fontSize="8" fill="#333">Card: {record.io_card_type || 'N/A'} | ALIM: {record.alim || 'N/A'}</text>
        {record.net_type && <text x="535" y="394" fontSize="8" fill="#0091D5">Network: {record.net_type}</text>}

        {/* ── SYSTEM BOX ── */}
        <rect x="600" y="80" width="180" height="180" fill="white" stroke="#00375A" strokeWidth="2.5" rx="6" />
        <rect x="600" y="80" width="180" height="30" fill="#00375A" rx="6" />
        <rect x="600" y="100" width="180" height="10" fill="#00375A" />
        <text x="690" y="100" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">{record.system || 'DCS'}</text>

        <text x="615" y="130" fontSize="10" fill="#333">Loop Type: <tspan fontWeight="bold" fill={isSIS ? '#DC2626' : '#00375A'}>{record.loop_type || 'N/A'}</tspan></text>
        <text x="615" y="150" fontSize="10" fill="#333">Sec: {record.sec || 'N/A'}</text>
        <text x="615" y="170" fontSize="10" fill="#333">Send To: {record.send_to || 'N/A'}</text>
        {record.net_type && <text x="615" y="190" fontSize="10" fill="#333">Net: {record.net_type}</text>}
        <text x="615" y="210" fontSize="9" fill="#666">Num: {record.num || 'N/A'}</text>
        <text x="615" y="230" fontSize="9" fill="#666">DWG: {record.loop_dwg || 'N/A'}</text>

        {/* Link I/O → System */}
        <line x1="520" y1="375" x2="560" y2="375" stroke="#000" strokeWidth="1.5" />
        <line x1="560" y1="375" x2="560" y2="200" stroke="#000" strokeWidth="1.5" />
        <line x1="560" y1="200" x2="600" y2="200" stroke="#000" strokeWidth="1.5" />
        <polygon points="595,195 605,200 595,205" fill="#00375A" />

        {/* ── TITLE BLOCK ── */}
        <rect x="30" y="430" width="780" height="55" fill="white" stroke="#000" strokeWidth="2" />
        <line x1="400" y1="430" x2="400" y2="485" stroke="#000" />
        <line x1="600" y1="430" x2="600" y2="485" stroke="#000" />
        <line x1="710" y1="430" x2="710" y2="485" stroke="#000" />
        <line x1="30" y1="455" x2="810" y2="455" stroke="#000" />

        <text x="45" y="448" fontSize="9" fill="#666">LOOP DIAGRAM</text>
        <text x="45" y="475" fontSize="16" fontWeight="bold" fill="#00375A">{record.tag}</text>
        <text x="415" y="448" fontSize="9" fill="#666">{record.service}</text>
        <text x="415" y="475" fontSize="9" fill="#333">Function: {record.function} | Loop: {record.loop_type} | System: {record.system}</text>
        <text x="615" y="448" fontSize="9" fill="#666">DWG: {record.loop_dwg || 'N/A'}</text>
        <text x="615" y="475" fontSize="9" fill="#333">Date: {new Date().toLocaleDateString('fr-FR')}</text>
        <text x="725" y="448" fontSize="9" fill="#666">Rev: {record.rev || '001.0000'}</text>
        <text x="725" y="475" fontSize="9" fill="#333">Sheet: 1/1</text>

        {/* ── NOTES ── */}
        {(record.obs_ins || record.obs_wir) && (
          <>
            <text x="400" y="135" fontSize="9" fontWeight="bold" fill="#333">NOTES:</text>
            {record.obs_ins && <text x="400" y="150" fontSize="8" fill="#666">INS: {record.obs_ins.substring(0, 50)}</text>}
            {record.obs_wir && <text x="400" y="165" fontSize="8" fill="#666">WIR: {record.obs_wir.substring(0, 50)}</text>}
          </>
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: JB DIAGRAM (Preview SVG)
// ─────────────────────────────────────────────────────────

