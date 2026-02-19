// ═══════════════════════════════════════════════════════════════════════════
// KORE — RevisionModal
// Modal ajout révision : upload fichier + Rédacteur / Vérificateur / Approbateur
// v2.1 : + champs verificateur et approbateur (optionnels)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef } from 'react';
import { X, Upload, FileText, RefreshCw, Trash2 } from 'lucide-react';
import { STATUTS } from '../../../../constants/Kore';
import { StatutBadge } from '../../common/StatutBadge';
import { formatFileSize } from '../../../../services/Kore';

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.xlsx,.xls,.dwg,.dxf,.pptx,.txt';
const MAX_SIZE_MB    = 50;

export function RevisionModal({ doc, onClose, onSave, notify }) {
  const [revision,     setRevision]     = useState('');
  const [status,       setStatus]       = useState('IFR');
  const [author,       setAuthor]       = useState('');       // rédacteur
  const [verificateur, setVerificateur] = useState('');
  const [approbateur,  setApprobateur]  = useState('');
  const [changes,      setChanges]      = useState('');
  const [file,         setFile]         = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [dragOver,     setDragOver]     = useState(false);
  const fileRef = useRef(null);

  const handleFile = (f) => {
    if (!f) return;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      notify(`❌ Fichier trop volumineux (max ${MAX_SIZE_MB} MB)`, 'error');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSave = async () => {
    if (!revision.trim()) { notify('Le numéro de révision est obligatoire', 'error'); return; }
    if (!author.trim())   { notify("Le rédacteur est obligatoire", 'error'); return; }

    setLoading(true);
    const { error } = await onSave(
      doc.id,
      {
        revision:      revision.trim(),
        status,
        author:        author.trim(),
        redacteur:     author.trim(),
        verificateur:  verificateur.trim() || null,
        approbateur:   approbateur.trim()  || null,
        changes:       changes.trim(),
        revision_date: new Date().toISOString().split('T')[0],
      },
      file
    );
    setLoading(false);

    if (error) {
      notify('❌ ' + (error.message || 'Erreur lors de l\'enregistrement'), 'error');
      return;
    }
    notify(`✅ Révision ${revision} enregistrée${file ? ' avec fichier' : ''}`);
    onClose();
  };

  const inputCls = 'w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#003D5C] text-base">Nouvelle révision</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document reference */}
        <div className="text-xs font-mono text-[#009BA4] font-bold mb-5 bg-[#009BA4]/8 px-3 py-2 rounded-lg border border-[#009BA4]/20 flex items-center justify-between">
          <span>{doc.doc_number}</span>
          <span className="text-gray-500 font-normal">
            rév. courante : <span className="font-bold text-[#003D5C]">{doc.current_revision}</span>
            {' '}<StatutBadge code={doc.current_status} />
          </span>
        </div>

        <div className="space-y-4">
          {/* Révision + Statut */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Révision <span className="text-red-500">*</span>
              </label>
              <input
                type="text" value={revision}
                onChange={e => setRevision(e.target.value.slice(0, 4))}
                placeholder="1" maxLength={4}
                className={`${inputCls} font-mono`}
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Statut <span className="text-red-500">*</span>
              </label>
              <select value={status} onChange={e => setStatus(e.target.value)} className={inputCls}>
                {Object.entries(STATUTS).map(([k, v]) => (
                  <option key={k} value={k}>{k} — {v}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Rédacteur */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Rédacteur <span className="text-red-500">*</span>
            </label>
            <input
              type="text" value={author} onChange={e => setAuthor(e.target.value)}
              placeholder="Prénom NOM" className={inputCls}
            />
          </div>

          {/* Vérificateur + Approbateur */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Vérificateur <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <input
                type="text" value={verificateur} onChange={e => setVerificateur(e.target.value)}
                placeholder="Prénom NOM" className={inputCls}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Approbateur <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <input
                type="text" value={approbateur} onChange={e => setApprobateur(e.target.value)}
                placeholder="Prénom NOM" className={inputCls}
              />
            </div>
          </div>

          {/* Objet */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Objet des modifications
            </label>
            <textarea
              value={changes} onChange={e => setChanges(e.target.value)}
              rows={2} placeholder="Description des modifications..."
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Zone upload fichier */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Fichier joint <span className="text-gray-400 normal-case font-normal">(PDF, DOCX, DWG… max 50 MB)</span>
            </label>

            {!file ? (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all
                  ${dragOver
                    ? 'border-[#009BA4] bg-[#009BA4]/5'
                    : 'border-gray-200 hover:border-[#009BA4]/50 hover:bg-gray-50'
                  }
                `}
              >
                <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-[#009BA4]">Cliquez</span> ou glissez un fichier ici
                </p>
                <input
                  ref={fileRef} type="file" accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={e => handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="border-2 border-[#009BA4]/30 bg-[#009BA4]/5 rounded-xl p-3 flex items-center gap-3">
                <FileText className="w-8 h-8 text-[#009BA4] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#003D5C] truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Retirer le fichier"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave} disabled={loading}
            className="flex-1 bg-[#003D5C] hover:bg-[#002A42] text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading
              ? <><RefreshCw className="w-4 h-4 animate-spin" />{file ? 'Upload...' : 'Enregistrement...'}</>
              : <>Enregistrer{file ? ' + fichier' : ''}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}