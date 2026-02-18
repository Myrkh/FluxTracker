// ═══════════════════════════════════════════════════════════════════════════
// OmniLink - CableBookView Component (Orchestrateur)
// 3 carnets de câbles : Unité, Local Technique, Multiconducteur
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Cable, MapPin, Building2, Zap } from 'lucide-react';
import { useCableBooks } from '../../../../hooks/OmniLink/useCableBooks';
import { UnitCableBook } from './UnitCableBook';
import { LocalCableBook } from './LocalCableBook';
import { MulticonductorBook } from './MulticonductorBook';

const TABS = [
  { id: 'unit', label: 'Unité', icon: MapPin, color: 'text-green-600' },
  { id: 'local', label: 'Local Technique', icon: Building2, color: 'text-blue-600' },
  { id: 'multi', label: 'Multiconducteur', icon: Zap, color: 'text-purple-600' },
];

export function CableBookView() {
  const [activeTab, setActiveTab] = useState('unit');
  
  const cableBooks = useCableBooks();
  const {
    unitRecords,
    localRecords,
    multiRecords,
    cableTypes,
    loading,
    
    // Unit actions
    updateUnitRecord,
    deleteUnitRecord,
    bulkAddUnit,
    
    // Local actions
    updateLocalRecord,
    deleteLocalRecord,
    bulkAddLocal,
    
    // Multi actions
    addMultiRecord,
    updateMultiRecord,
    deleteMultiRecord,
  } = cableBooks;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#00375A] mb-4"></div>
          <p className="text-gray-600">Chargement des carnets de câbles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] rounded-2xl shadow-xl px-8 py-6">
        <div className="flex items-center space-x-4">
          <div className="bg-white/20 p-3 rounded-xl">
            <Cable className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Carnets de Câbles</h2>
            <p className="text-[#00B4D8]/90 text-sm mt-1">
              Gestion des câblages terrain, local technique et multiconducteurs
            </p>
          </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-200">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium text-sm transition-all duration-200 flex items-center justify-center space-x-2 border-b-2 ${
                  isActive
                    ? 'text-[#00375A] border-[#00375A] bg-[#00375A]/5'
                    : 'text-gray-500 border-transparent hover:text-[#00375A] hover:bg-gray-50'
                }`}>
                <Icon className={`w-4 h-4 ${isActive ? tab.color : ''}`} />
                <span>{tab.label}</span>
                {tab.id === 'unit' && unitRecords.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                    {unitRecords.length}
                  </span>
                )}
                {tab.id === 'local' && localRecords.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                    {localRecords.length}
                  </span>
                )}
                {tab.id === 'multi' && multiRecords.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                    {multiRecords.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB CONTENT */}
        <div className="p-6">
          {activeTab === 'unit' && (
            <UnitCableBook
              unitRecords={unitRecords}
              cableBooks={cableBooks}
              onUpdate={updateUnitRecord}
              onDelete={deleteUnitRecord}
              onBulkAdd={bulkAddUnit}
            />
          )}

          {activeTab === 'local' && (
            <LocalCableBook
              localRecords={localRecords}
              cableBooks={cableBooks}
              onUpdate={updateLocalRecord}
              onDelete={deleteLocalRecord}
              onBulkAdd={bulkAddLocal}
            />
          )}

          {activeTab === 'multi' && (
            <MulticonductorBook
              multiRecords={multiRecords}
              onAdd={addMultiRecord}
              onUpdate={updateMultiRecord}
              onDelete={deleteMultiRecord}
            />
          )}
        </div>
      </div>
    </div>
  );
}
