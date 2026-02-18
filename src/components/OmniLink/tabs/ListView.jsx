import React, { useState, useMemo } from 'react';
import { Search, Edit3, Trash2, Download, X, Save, Database, Filter } from 'lucide-react';
import { useApp } from '../../../context/OmniLink';
import { Badge, EmptyState } from '../common';
import { COLORS } from '../../../constants/OmniLink';
import { ExportService } from '../../../services/OmniLink';

export function ListView() {
  const { records, notify, recordOps } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLoopType, setFilterLoopType] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !searchTerm ||
        r.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.function?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLoop = !filterLoopType || r.loop_type === filterLoopType;
      return matchSearch && matchLoop;
    });
  }, [records, searchTerm, filterLoopType]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(r => r.id)));
  };

  const handleExport = async () => {
    try {
      const toExport = selectedIds.size > 0
        ? records.filter(r => selectedIds.has(r.id))
        : records;
      await ExportService.toExcel(toExport);
      notify(`Export de ${toExport.length} points réussi !`);
    } catch (err) {
      notify('Erreur export: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id, tag) => {
    if (!window.confirm(`Supprimer le point ${tag} ?`)) return;
    try {
      await recordOps.remove(id);
      notify(`Point ${tag} supprimé`);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg"><Database className="w-6 h-6" /></div>
              <span>Liste des Points INS</span>
            </h2>
            <p className="text-[#00B4D8]/80 mt-1 text-sm">{records.length} point{records.length > 1 ? 's' : ''} enregistré{records.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedIds.size > 0 && (
              <span className="text-white/80 text-sm">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
            )}
            <button onClick={handleExport}
              className="px-5 py-2.5 bg-white text-[#00375A] rounded-lg font-medium hover:bg-[#00B4D8] hover:text-white transition-all duration-200 flex items-center space-x-2 shadow-lg">
              <Download className="w-4 h-4" /><span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Rechercher TAG, SERVICE, FUNCTION..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#00375A] focus:ring-4 focus:ring-[#00375A]/10 outline-none transition-all text-sm" />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {['BPCS', 'SIS', 'MAINT'].map(lt => (
              <button key={lt} onClick={() => setFilterLoopType(filterLoopType === lt ? null : lt)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterLoopType === lt ? 'bg-[#00375A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{lt}</button>
            ))}
            {filterLoopType && (
              <button onClick={() => setFilterLoopType(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border-2 border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                {['TAG', 'SERVICE', 'FUNCTION', 'LOC', 'LOOP TYPE', 'SYSTEM', 'SIG', 'RACK', 'SLOT', 'I/O ADDRESS', 'JB TAG', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="12"><EmptyState icon={<Database />} title="Aucun point trouvé" description="Modifiez vos filtres ou créez un nouveau point" /></td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className={`hover:bg-blue-50/30 transition-colors ${selectedIds.has(r.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)} className="rounded border-gray-300" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="font-bold text-[#00375A]">{r.tag}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{r.service}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{r.function}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.loc}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.loop_type && <Badge variant={r.loop_type}>{r.loop_type}</Badge>}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.system}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.sig}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{r.rack}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{r.slot}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{r.io_address}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.jb_tag}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button onClick={() => handleDelete(r.id, r.tag)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-500 text-right">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: DASHBOARD
// ─────────────────────────────────────────────────────────

