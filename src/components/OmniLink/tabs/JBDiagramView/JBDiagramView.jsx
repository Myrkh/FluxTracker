import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { Box, Download } from 'lucide-react';
import { useApp } from '../../../../context/OmniLink';
import { EmptyState } from '../../common';
import { customSelectStyles } from '../../../../constants/OmniLink';
import { JBDiagramSVG } from './JBDiagramSVG';

export function JBDiagramView() {
  const { records } = useApp();

  const jbGroups = useMemo(() => {
    const groups = {};
    records.forEach(r => {
      if (r.jb_tag) {
        if (!groups[r.jb_tag]) groups[r.jb_tag] = [];
        groups[r.jb_tag].push(r);
      }
    });
    return groups;
  }, [records]);

  const jbOptions = useMemo(() =>
    Object.keys(jbGroups).map(jb => ({ value: jb, label: `${jb} (${jbGroups[jb].length} points)` })),
    [jbGroups]
  );

  const [selectedJB, setSelectedJB] = useState(null);
  const jbRecords = selectedJB ? jbGroups[selectedJB.value] || [] : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg"><Box className="w-6 h-6" /></div>
            <span>Schéma de Boîte de Jonction (JB)</span>
          </h2>
          <p className="text-[#00B4D8]/80 mt-1 text-sm">{Object.keys(jbGroups).length} JB détectée{Object.keys(jbGroups).length > 1 ? 's' : ''} dans la base</p>
        </div>

        <div className="p-6">
          <div className="max-w-md mb-6">
            <FormField label="Sélectionner une Boîte de Jonction">
              <Select value={selectedJB} onChange={setSelectedJB}
                options={jbOptions} placeholder="Choisir une JB..."
                styles={customSelectStyles} isClearable />
            </FormField>
          </div>

          {selectedJB && jbRecords.length > 0 ? (
            <JBDiagramSVG jbTag={selectedJB.value} records={jbRecords} />
          ) : (
            <EmptyState icon={<Box />} title={Object.keys(jbGroups).length === 0 ? 'Aucune JB définie' : 'Sélectionnez une JB'}
              description={Object.keys(jbGroups).length === 0
                ? "Ajoutez des JB_TAG dans vos points pour voir les schémas"
                : "Choisissez une boîte de jonction dans la liste"} />
          )}
        </div>
      </div>
    </div>
  );
}

/** SVG-based JB Diagram */
