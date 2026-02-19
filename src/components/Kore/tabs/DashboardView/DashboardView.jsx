// ═══════════════════════════════════════════════════════════════════════════
// KORE — DashboardView
// Statistiques documentaires + indicateurs enrichis
// ═══════════════════════════════════════════════════════════════════════════

import React, { useMemo } from 'react';
import { BarChart3, Eye, FileText, Layers, CheckCircle2, Paperclip } from 'lucide-react';
import { DISCIPLINES, STATUTS, STATUTS_EMIS } from '../../../../constants/Kore';
import { StatutBadge } from '../../common/StatutBadge';

export function DashboardView({ docs }) {
  const byDisc = useMemo(() => {
    const m = {};
    docs.forEach(d => { m[d.discipline_code] = (m[d.discipline_code] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [docs]);

  const byStatus = useMemo(() => {
    const m = {};
    docs.forEach(d => { m[d.current_status] = (m[d.current_status] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [docs]);

  const emitted     = docs.filter(d => STATUTS_EMIS.includes(d.current_status)).length;
  const withFiles   = docs.filter(d => d.kore_revisions?.some(r => r.file_path)).length;
  const disciplines = new Set(docs.map(d => d.discipline_code)).size;
  const projects    = new Set(docs.map(d => d.project_number)).size;

  const maxDisc = byDisc[0]?.[1] || 1;

  const stats = [
    { label: 'Documents',       value: docs.length,  color: '#003D5C', icon: FileText      },
    { label: 'Émis (IFC+)',     value: emitted,       color: '#009BA4', icon: CheckCircle2  },
    { label: 'Disciplines',     value: disciplines,   color: '#0091D5', icon: Layers        },
    { label: 'Avec fichier',    value: withFiles,     color: '#2ECC71', icon: Paperclip     },
  ];

  if (docs.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-20 text-center">
        <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">Aucune donnée</p>
        <p className="text-gray-400 text-sm mt-1">Créez des documents pour voir les statistiques</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Stats globales */}
      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex items-center gap-4">
            <div className="p-2.5 rounded-xl" style={{ background: color + '15' }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Par discipline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h4 className="font-bold text-[#003D5C] mb-5 text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#009BA4]" /> Documents par discipline
        </h4>
        <div className="space-y-2.5">
          {byDisc.map(([code, count]) => (
            <div key={code} className="flex items-center gap-3">
              <span
                className="text-xs font-bold font-mono w-8 text-[#003D5C] shrink-0"
                title={DISCIPLINES[code]}
              >
                {code}
              </span>
              <div className="flex-1 h-4 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${(count / maxDisc) * 100}%`, background: '#009BA4' }}
                />
              </div>
              <span className="text-xs font-bold text-gray-600 w-5 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Par statut */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h4 className="font-bold text-[#003D5C] mb-5 text-sm flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#009BA4]" /> Répartition des statuts
        </h4>
        <div className="space-y-2.5">
          {byStatus.map(([code, count]) => (
            <div key={code} className="flex items-center gap-3">
              <StatutBadge code={code} />
              <span className="text-xs text-gray-500 flex-1 truncate">{STATUTS[code]}</span>
              <span className="text-sm font-bold text-[#003D5C]">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Affaires actives */}
      {projects > 0 && (
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h4 className="font-bold text-[#003D5C] mb-4 text-sm flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#009BA4]" />
            Affaires actives — {projects} projet{projects > 1 ? 's' : ''}
          </h4>
          <div className="flex flex-wrap gap-2">
            {[...new Set(docs.map(d => d.project_number))].sort().map(pn => {
              const count = docs.filter(d => d.project_number === pn).length;
              return (
                <div key={pn} className="flex items-center gap-2 px-3 py-1.5 bg-[#003D5C]/5 rounded-lg border border-[#003D5C]/10">
                  <span className="font-mono text-xs font-bold text-[#003D5C]">{pn}</span>
                  <span className="text-xs text-gray-500">{count} doc{count > 1 ? 's' : ''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
