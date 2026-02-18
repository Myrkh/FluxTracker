import React, { useMemo } from 'react';
import { Cable } from 'lucide-react';
import { useApp } from '../../../context/OmniLink';
import { EmptyState } from '../common';
import { SIG_CABLE_MAP } from '../../../constants/OmniLink';

export function CableScheduleView() {
  const { records } = useApp();

  const cables = useMemo(() => {
    return records.filter(r => r.sig).map(r => {
      const spec = SIG_CABLE_MAP[r.sig] || {};
      return {
        tag: r.tag, service: r.service, sig: r.sig,
        jb_tag: r.jb_tag || '—', system: r.system || '—',
        io_address: r.io_address || '—',
        cable_type: spec.type || 'N/A',
        shield: spec.shield ? 'Oui' : 'Non',
        from: r.tag, to: r.jb_tag || r.system_cabinet || '—',
        isolator: r.isolator || 'NR',
        lightning: r.lightning || 'NR',
      };
    });
  }, [records]);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg"><Cable className="w-6 h-6" /></div>
          <span>Carnet de Câbles</span>
        </h2>
        <p className="text-[#00B4D8]/80 mt-1 text-sm">{cables.length} câble{cables.length > 1 ? 's' : ''} identifié{cables.length > 1 ? 's' : ''}</p>
      </div>

      <div className="p-6">
        {cables.length === 0 ? (
          <EmptyState icon={<Cable />} title="Aucun câble" description="Ajoutez des points avec des signaux (SIG) pour voir le carnet" />
        ) : (
          <div className="overflow-x-auto rounded-lg border-2 border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['TAG', 'SERVICE', 'SIG', 'TYPE CÂBLE', 'BLINDAGE', 'FROM', 'TO (JB)', 'ISOLATOR', 'LIGHTNING', 'I/O ADDRESS'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cables.map((c, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-2.5 text-sm font-bold text-[#00375A]">{c.tag}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 max-w-[180px] truncate">{c.service}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-700">{c.sig}</td>
                    <td className="px-4 py-2.5 text-sm text-[#0091D5] font-medium">{c.cable_type}</td>
                    <td className="px-4 py-2.5 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.shield === 'Oui' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.shield}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{c.from}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{c.to}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{c.isolator}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{c.lightning}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-500">{c.io_address}</td>
                  </tr>
                ))}
 </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}