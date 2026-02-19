// ═══════════════════════════════════════════════════════════════════════════
// OmniLink - UnitCableBook Component
// Carnet de câbles UNITÉ : Capteur terrain → JB
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { Download, Plus, Trash2, Save, X } from 'lucide-react';
import { useApp } from '../../../../context/OmniLink/AppContext';
import { EmptyState } from '../../common/EmptyState';
import { customSelectStyles } from '../../../../constants/OmniLink';
import { CableBookExportService } from '../../../../services/OmniLink/CableBookExportService';

/**
 * @param {object[]} cableTypes - Types câbles TERRAIN depuis ref_cable_types (Supabase)
 */
export function UnitCableBook({ unitRecords, cableTypes = [], onUpdate, onDelete, onBulkAdd }) {
  const { records, notify } = useApp();
  const [selectedInsRecords, setSelectedInsRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Instruments disponibles (pas encore dans le carnet)
  const availableRecords = useMemo(() => {
    const existingIds = new Set(unitRecords.map(u => u.ins_record_id));
    return records.filter(r => !existingIds.has(r.id) && r.tag);
  }, [records, unitRecords]);

  // Options câbles depuis Supabase — format react-select
  const cableOptions = useMemo(() =>
    cableTypes.map(c => ({
      value: c.code,
      label: c.description ? `${c.code} — ${c.description}` : c.code,
    })),
    [cableTypes]
  );

  // Ajouter les instruments sélectionnés
  const handleBulkAdd = async () => {
    if (selectedInsRecords.length === 0) {
      notify('Sélectionnez au moins un instrument', 'error');
      return;
    }
    
    try {
      const count = await onBulkAdd(selectedInsRecords);
      notify(`${count} instrument(s) ajouté(s) au carnet Unité`);
      setSelectedInsRecords([]);
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    }
  };

  // Édition inline
  const startEdit = (record) => {
    setEditingId(record.id);
    setEditForm({
      cable_type: record.cable_type,
      terminal: record.terminal || '',
      obs: record.obs || ''
    });
  };

  const saveEdit = async () => {
    try {
      await onUpdate(editingId, editForm);
      notify('Enregistrement réussi');
      setEditingId(null);
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  // Export Excel
  const handleExport = async () => {
    try {
      const workbook = await CableBookExportService.exportUnit(unitRecords);
      await CableBookExportService.downloadExcel(workbook, 'Carnet_Unite_Artelia');
      notify('Export Excel réussi');
    } catch (err) {
      notify('Erreur export: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER ACTIONS */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">📍 Carnet Unité — Capteur terrain → JB</h3>
          <div className="flex items-center space-x-3">
            <button onClick={handleExport}
              className="px-4 py-2 bg-[#00375A] text-white rounded-lg hover:bg-[#004A73] transition-all flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Sélection instruments à ajouter */}
        {availableRecords.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Select
                  isMulti
                  value={selectedInsRecords.map(r => ({ value: r.id, label: `${r.tag} — ${r.service || ''}` }))}
                  onChange={(selected) => {
                    const ids = selected.map(s => s.value);
                    setSelectedInsRecords(availableRecords.filter(r => ids.includes(r.id)));
                  }}
                  options={availableRecords.map(r => ({ 
                    value: r.id, 
                    label: `${r.tag} — ${r.service || ''}`,
                    jb: r.jb_tag
                  }))}
                  placeholder="Sélectionnez les instruments à ajouter..."
                  styles={customSelectStyles}
                />
              </div>
              <button onClick={handleBulkAdd}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center space-x-2">
                <Plus className="w-4 h-4" />
                <span>Ajouter ({selectedInsRecords.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TABLE */}
      {unitRecords.length === 0 ? (
        <EmptyState
          icon={<Plus className="w-12 h-12" />}
          title="Aucun instrument dans le carnet"
          description="Sélectionnez des instruments ci-dessus pour commencer"
        />
      ) : (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#00375A] text-white">
                <th className="px-4 py-3 text-left font-semibold">TAG</th>
                <th className="px-4 py-3 text-left font-semibold">TYPE CÂBLE</th>
                <th className="px-4 py-3 text-left font-semibold">JB TAG</th>
                <th className="px-4 py-3 text-left font-semibold">BORNE</th>
                <th className="px-4 py-3 text-left font-semibold">OBS</th>
                <th className="px-4 py-3 text-center font-semibold w-24">Actions</th>
              </tr>
            </thead>
            <tbody>
              {unitRecords.map((record, idx) => {
                const isEditing = editingId === record.id;
                const isComplete = record.cable_type && record.terminal;

                return (
                  <tr key={record.id} 
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      isComplete ? 'bg-green-50/30' : 'bg-orange-50/30'
                    }`}>
                    {/* TAG */}
                    <td className="px-4 py-3 font-mono font-semibold text-gray-800">
                      {record.tag}
                    </td>

                    {/* TYPE CÂBLE */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <Select
                          value={cableOptions.find(c => c.value === editForm.cable_type) || null}
                          onChange={(opt) => setEditForm({ ...editForm, cable_type: opt?.value || null })}
                          options={cableOptions}
                          placeholder="Sélectionner..."
                          styles={customSelectStyles}
                          isClearable
                          noOptionsMessage={() => 'Aucun câble disponible'}
                        />
                      ) : (
                        <span className={`text-sm ${record.cable_type ? 'text-gray-800 font-medium' : 'text-gray-400 italic'}`}>
                          {record.cable_type || '(à définir)'}
                        </span>
                      )}
                    </td>

                    {/* JB TAG */}
                    <td className="px-4 py-3 font-mono text-sm text-gray-700">
                      {record.jb_tag || '—'}
                    </td>

                    {/* BORNE */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.terminal}
                          onChange={(e) => setEditForm({ ...editForm, terminal: e.target.value })}
                          className="w-20 px-2 py-1 text-sm border-2 border-gray-300 rounded focus:border-[#00375A] outline-none"
                          placeholder="1-2"
                        />
                      ) : (
                        <span className={`text-sm ${record.terminal ? 'text-gray-800 font-medium' : 'text-gray-400 italic'}`}>
                          {record.terminal || '(à définir)'}
                        </span>
                      )}
                    </td>

                    {/* OBS */}
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.obs}
                          onChange={(e) => setEditForm({ ...editForm, obs: e.target.value })}
                          className="w-full px-2 py-1 text-sm border-2 border-gray-300 rounded focus:border-[#00375A] outline-none"
                          placeholder="Observations..."
                        />
                      ) : (
                        <span className="text-sm text-gray-600">{record.obs || '—'}</span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center space-x-2">
                        {isEditing ? (
                          <>
                            <button onClick={saveEdit}
                              className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-all">
                              <Save className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit}
                              className="p-1.5 bg-gray-400 text-white rounded hover:bg-gray-500 transition-all">
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => startEdit(record)}
                              className="p-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-all">
                              ✏️
                            </button>
                            <button onClick={() => onDelete(record.id)}
                              className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-all">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* FOOTER STATS */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <span className="text-gray-600">
              <strong>{unitRecords.length}</strong> instrument(s) dans le carnet
            </span>
            <span className="text-gray-600">
              <strong>{unitRecords.filter(r => r.cable_type && r.terminal).length}</strong> complet(s)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}