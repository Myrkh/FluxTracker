import React from 'react';
import { SIG_CABLE_MAP } from '../../../../constants/OmniLink';

export function JBDiagramSVG({ jbTag, records }) {
  const rowH = 28;
  const headerH = 40;
  const boxH = headerH + records.length * rowH + 20;
  const svgH = Math.max(boxH + 150, 400);

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-sm">
          <span className="font-bold text-[#00375A]">{jbTag}</span>
          <span className="text-gray-400">—</span>
          <span className="text-gray-600">{records.length} point{records.length > 1 ? 's' : ''} raccordé{records.length > 1 ? 's' : ''}</span>
        </div>
        <div className="text-xs text-gray-400">Phase 3 : Export PDF à venir</div>
      </div>

      <svg viewBox={`0 0 840 ${svgH}`} className="w-full" style={{ maxHeight: '600px' }}>
        <defs>
          <pattern id="jbgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f5f5f5" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="840" height={svgH} fill="url(#jbgrid)" />

        {/* JB Box */}
        <rect x="50" y="30" width="380" height={boxH} fill="white" stroke="#000" strokeWidth="3" rx="4" />
        <rect x="50" y="30" width="380" height={headerH} fill="#00375A" rx="4" />
        <rect x="50" y="60" width="380" height="10" fill="#00375A" />
        <text x="240" y="56" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">{jbTag}</text>

        {/* Column headers */}
        <text x="70" y={30 + headerH + 15} fontSize="8" fontWeight="bold" fill="#666">N°</text>
        <text x="95" y={30 + headerH + 15} fontSize="8" fontWeight="bold" fill="#666">TAG</text>
        <text x="205" y={30 + headerH + 15} fontSize="8" fontWeight="bold" fill="#666">SIGNAL</text>
        <text x="275" y={30 + headerH + 15} fontSize="8" fontWeight="bold" fill="#666">BORNES</text>
        <text x="350" y={30 + headerH + 15} fontSize="8" fontWeight="bold" fill="#666">SHIELD</text>
        <line x1="60" y1={30 + headerH + 20} x2="420" y2={30 + headerH + 20} stroke="#ddd" />

        {/* Terminal rows */}
        {records.map((r, i) => {
          const y = 30 + headerH + 25 + i * rowH;
          const termFrom = i * 2 + 1;
          const termTo = i * 2 + 2;
          const hasShield = r.isolator && r.isolator !== 'NR';

          return (
            <g key={r.id}>
              {i % 2 === 0 && <rect x="55" y={y - 5} width="370" height={rowH} fill="#F8FAFC" rx="2" />}
              <rect x="60" y={y - 2} width="360" height={rowH - 6} fill="white" stroke="#E2E8F0" rx="2" />
              <text x="72" y={y + 13} fontSize="9" fontWeight="bold" fill="#333">{i + 1}</text>
              <text x="95" y={y + 13} fontSize="9" fontWeight="bold" fill="#00375A">{r.tag}</text>
              <text x="205" y={y + 13} fontSize="9" fill="#666">{r.sig || 'N/A'}</text>
              <text x="275" y={y + 13} fontSize="9" fill="#333">{termFrom}–{termTo}</text>
              <text x="360" y={y + 13} fontSize="9" fill={hasShield ? '#0091D5' : '#ccc'}>{hasShield ? '⏚' : '—'}</text>

              {/* Connection line to instrument */}
              <line x1="430" y1={y + 8} x2="500" y2={y + 8} stroke="#000" strokeWidth="1"
                strokeDasharray={r.sig?.startsWith('DI') || r.sig?.startsWith('DO') ? '4,3' : 'none'} />

              {/* Instrument circle */}
              <circle cx="520" cy={y + 8} r="12" fill="white" stroke="#000" strokeWidth="1.5" />
              <text x="520" y={y + 11} textAnchor="middle" fontSize="6" fontWeight="bold" fill="#333">
                {r.tag.length > 8 ? r.tag.substring(0, 8) : r.tag}
              </text>

              {/* Service text */}
              <text x="545" y={y + 6} fontSize="7" fill="#333">{(r.service || '').substring(0, 30)}</text>
              <text x="545" y={y + 16} fontSize="7" fill="#999">{r.sig || ''} | {r.alim || ''}</text>
            </g>
          );
        })}

        {/* Cable Schedule */}
        <text x="50" y={boxH + 55} fontSize="11" fontWeight="bold" fill="#00375A">CABLE SCHEDULE</text>
        <line x1="50" y1={boxH + 60} x2="780" y2={boxH + 60} stroke="#00375A" strokeWidth="1.5" />

        {/* Headers */}
        {['TAG', 'CABLE TYPE', 'FROM', 'TO', 'SIGNAL', 'ALIM'].map((h, i) => (
          <text key={h} x={60 + i * 120} y={boxH + 78} fontSize="8" fontWeight="bold" fill="#666">{h}</text>
        ))}

        {records.slice(0, 8).map((r, i) => {
          const y = boxH + 90 + i * 16;
          const cable = SIG_CABLE_MAP[r.sig] || { type: 'N/A' };
          return (
            <g key={`cable-${r.id}`}>
              <text x="60" y={y} fontSize="8" fill="#333">{r.tag}</text>
              <text x="180" y={y} fontSize="8" fill="#0091D5">{cable.type}</text>
              <text x="300" y={y} fontSize="8" fill="#333">{r.tag}</text>
              <text x="420" y={y} fontSize="8" fill="#333">{jbTag}</text>
              <text x="540" y={y} fontSize="8" fill="#333">{r.sig || 'N/A'}</text>
              <text x="660" y={y} fontSize="8" fill="#333">{r.alim || 'N/A'}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: CABLE SCHEDULE (Carnet de câbles)
// ─────────────────────────────────────────────────────────

