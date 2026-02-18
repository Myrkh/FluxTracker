import React, { useState, useMemo } from 'react';
import Select from 'react-select';
import { GitBranch, Download } from 'lucide-react';
import { useApp } from '../../../../context/OmniLink';
import { EmptyState } from '../../common';
import { customSelectStyles } from '../../../../constants/OmniLink';
import { LoopDiagramSVG } from './LoopDiagramSVG';
import { FormField } from '../../common/FormField';

export function LoopDiagramView() {
  const { records } = useApp();
  const [selectedTag, setSelectedTag] = useState(null);

  const record = useMemo(() =>
    records.find(r => r.tag === selectedTag?.value), [records, selectedTag]
  );

  const tagOptions = useMemo(() =>
    records.map(r => ({ value: r.tag, label: `${r.tag} — ${r.service || ''}` })),
    [records]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg"><GitBranch className="w-6 h-6" /></div>
            <span>Schéma de Boucle (Loop Diagram)</span>
          </h2>
          <p className="text-[#00B4D8]/80 mt-1 text-sm">Sélectionnez un point pour prévisualiser et générer le schéma</p>
        </div>

        <div className="p-6">
          <div className="max-w-md mb-6">
            <FormField label="Sélectionner un TAG">
              <Select value={selectedTag} onChange={setSelectedTag}
                options={tagOptions} placeholder="Choisir un point INS..."
                styles={customSelectStyles} isClearable />
            </FormField>
          </div>

          {record ? (
            <LoopDiagramSVG record={record} />
          ) : (
            <EmptyState icon={<GitBranch />} title="Aucun point sélectionné"
              description="Sélectionnez un TAG pour voir le schéma de boucle" />
          )}
        </div>
      </div>
    </div>
  );
}

/** SVG-based Loop Diagram Preview */
