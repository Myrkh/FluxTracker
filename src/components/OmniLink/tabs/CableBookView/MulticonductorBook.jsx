// ═══════════════════════════════════════════════════════════════════════════
// OmniLink - MulticonductorBook Component
// Carnet de câbles MULTICONDUCTEUR : Grandes liaisons JB
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Download, Plus, Trash2, Edit3, X } from 'lucide-react';
import { useApp } from '../../../../context/OmniLink';
import { EmptyState } from '../../common';
import { STANDARD_CABLE_TYPES } from '../../../../constants/OmniLink/cableTypes';
import { CableBookExportService } from '../../../../services/OmniLink/CableBookExportService';

export function MulticonductorBook({ multiRecords, onAdd, onUpdate, onDelete }) {
  const { notify } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    jb_tag: '',
    location: '',
    multiconductor_type: '',
    from_point: '',
    to_point: '',
    obs: ''
  });

  // Options multiconducteurs
  const multiOptions = STANDARD_CABLE_TYPES.MULTICONDUCTOR;

  const resetForm = () => {
    setForm({
      jb_tag: '',
      location: '',
      multiconductor_type: '',
      from_point: '',
      to_point: '',
      obs: ''
    });
  };

  const handleAdd = async () => {
    if (!form.jb_tag || !form.multiconductor_type) {
      notify('TAG BJ et Type multiconducteur requis', 'error');
      return;
    }

    try {
      await onAdd({ ...form, created_by: 'user' });
      notify('Liaison multiconducteur ajoutée');
      resetForm();
      setShowModal(false);
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    }
  };

  const handleExport = async () => {
    try {
      const workbook = await CableBookExportService.exportMulticonductor(multiRecords);
      await CableBookExportService.downloadExcel(workbook, 'Carnet_Multiconducteur_Artelia');
      notify('Export Excel réussi');
    } catch (err) {
      notify('Erreur export: ' + err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">🔌 Carnet Multiconducteur — Grandes liaisons JB</h3>
          <div className="flex items-center space-x-3">
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Nouvelle liaison</span>
            </button>
            <button onClick={handleExport}
              className="px-4 py-2 bg-[#00375A] text-white rounded-lg hover:bg-[#004A73] transition-all flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      {multiRecords.length === 0 ? (
        <EmptyState
          icon={<Plus className="w-12 h-12" />}
          title="Aucune liaison multiconducteur"
          description="Cliquez sur 'Nouvelle liaison' pour ajouter une entrée"
        />
      ) : (
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#00375A] text-white">
                <th className="px-4 py-3 text-left font-semibold">TAG BJ</th>
                <th className="px-4 py-3 text-left font-semibold">LIEU</th>
                <th className="px-4 py-3 text-left font-semibold">TYPE MULTICONDUCTEUR</th>
                <th className="px-4 py-3 text-left font-semibold">TENANT</th>
                <th className="px-4 py-3 text-left font-semibold">ABOUTISSANT</th>
                <th className="px-4 py-3 text-left font-semibold">OBS</th>
                <th className="px-4 py-3 text-center font-semibold w-20">Actions</th>
              </tr>
            </thead>
            <tbody>
              {multiRecords.map((record) => (
                <tr key={record.id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800">
                    {record.jb_tag}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {record.location || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-blue-700">
                    {record.multiconductor_type}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {record.from_point || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {record.to_point || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {record.obs || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center space-x-2">
                      <button onClick={() => onDelete(record.id)}
                        className="p-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition-all">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* FOOTER */}
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 text-sm text-gray-600">
            <strong>{multiRecords.length}</strong> liaison(s) multiconducteur
          </div>
        </div>
      )}

      {/* MODAL AJOUT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Nouvelle liaison multiconducteur</h3>
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="text-white/80 hover:text-white transition-all">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* TAG BJ */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  TAG BJ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.jb_tag}
                  onChange={(e) => setForm({ ...form, jb_tag: e.target.value.toUpperCase() })}
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-[#00375A] focus:ring-4 focus:ring-[#00375A]/10 outline-none"
                  placeholder="Ex: 510BJ1000"
                />
              </div>

              {/* LIEU */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Lieu</label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-[#00375A] focus:ring-4 focus:ring-[#00375A]/10 outline-none"
                  placeholder="Ex: Unité 12-A"
                />
              </div>

              {/* TYPE MULTICONDUCTEUR */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Type multiconducteur <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.multiconductor_type}
                  onChange={(e) => setForm({ ...form, multiconductor_type: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-[#00375A] focus:ring-4 focus:ring-[#00375A]/10 outline-none">
                  <option value="">Sélectionner...</option>
                  {multiOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* TENANT / ABOUTISSANT */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tenant</label>
                  <input
                    type="text"
                    value={form.from_point}
                    onChange={(e) => setForm({ ...form, from_point: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-[#00375A] focus:ring-4 focus:ring-[#00375A]/10 outline-none"
                    placeholder="Ex: Terrain"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Aboutissant</label>
                  <input
                    type="text"
                    value={form.to_point}
                    onChange={(e) => setForm({ ...form, to_point: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-[#00375A] focus:ring-4 focus:ring-[#00375A]/10 outline-none"
                    placeholder="Ex: LT-A1"
                  />
                </div>
              </div>

              {/* OBS */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Observations</label>
                <textarea
                  value={form.obs}
                  onChange={(e) => setForm({ ...form, obs: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 text-sm border-2 border-gray-200 rounded-lg focus:border-[#00375A] focus:ring-4 focus:ring-[#00375A]/10 outline-none resize-none"
                  placeholder="Observations optionnelles..."
                />
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end space-x-3 border-t border-gray-200">
              <button onClick={() => { setShowModal(false); resetForm(); }}
                className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-all font-medium">
                Annuler
              </button>
              <button onClick={handleAdd}
                className="px-6 py-2.5 bg-[#00375A] text-white rounded-lg hover:bg-[#004A73] transition-all font-medium">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
