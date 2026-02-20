// ═══════════════════════════════════════════════════════════════════════════
// KORE — NewTransmissionModal
// Sélection de documents + génération du bordereau BT-x PDF
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react';
import { X, Search, FileText, RefreshCw, Download, Send, Check } from 'lucide-react';
import { StatutBadge } from '../../common/StatutBadge';
import { generateBordereauPdf } from '../../../services/BtxService';

export function NewTransmissionModal({ docs, nextBtNumber, onSave, onClose, notify, user, profile }) {
  const [search,       setSearch]       = useState('');
  const [selected,     setSelected]     = useState(new Set());
  const [recipientName,  setRecipientName]  = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [notes,        setNotes]        = useState('');
  const [generating,   setGenerating]   = useState(false);

  const btNumber = nextBtNumber;

  // ── Filtrage docs disponibles ───────────────────────────────────────────
  const filteredDocs = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return docs;
    return docs.filter(d =>
      d.doc_number.toLowerCase().includes(q) ||
      d.title?.toLowerCase().includes(q)
    );
  }, [docs, search]);

  const toggleDoc = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filteredDocs.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredDocs.map(d => d.id)));
    }
  };

  const selectedDocs = docs.filter(d => selected.has(d.id));

  // ── Générer + sauvegarder ───────────────────────────────────────────────
  const handleGenerate = async () => {
    if (selected.size === 0) { notify('Sélectionnez au moins un document', 'error'); return; }

    setGenerating(true);
    try {
      const btData = { bt_number: btNumber, recipient_name: recipientName, recipient_email: recipientEmail, notes };

      // 1. Générer le PDF
      const pdfBytes = await generateBordereauPdf(btData, selectedDocs, user, profile);

      // 2. Déclencher le téléchargement
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${btNumber}_Bordereau_Artelia.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      // 3. Sauvegarder en BDD
      const { error } = await onSave(btData, selectedDocs);
      if (error) throw error;

      notify(`✅ ${btNumber} généré — ${selected.size} document${selected.size > 1 ? 's' : ''}`);
      onClose();
    } catch (err) {
      notify('❌ Erreur : ' + err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const inputCls = 'w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h3 className="font-bold text-[#003D5C] text-base flex items-center gap-2">
              <Send className="w-4 h-4 text-[#009BA4]" />
              Nouveau Bordereau de Transmission
            </h3>
            <p className="text-xs text-[#009BA4] font-mono font-bold mt-0.5">{btNumber}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* ── Colonne gauche : sélection documents ───────────────────── */}
          <div className="flex-1 flex flex-col border-r border-gray-100">
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Filtrer les documents..."
                  className="w-full pl-8 border-2 border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:border-[#009BA4] focus:outline-none"
                />
              </div>
              <div className="flex items-center justify-between">
                <button
                  onClick={toggleAll}
                  className="text-xs text-[#009BA4] font-semibold hover:text-[#003D5C] transition-colors"
                >
                  {selected.size === filteredDocs.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                </button>
                <span className="text-xs text-gray-400">
                  {selected.size} / {docs.length} sélectionné{selected.size > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1">
              {filteredDocs.map(doc => {
                const isSelected = selected.has(doc.id);
                return (
                  <button
                    key={doc.id}
                    onClick={() => toggleDoc(doc.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-xl border-2 transition-all
                      ${isSelected
                        ? 'border-[#009BA4] bg-[#009BA4]/5'
                        : 'border-gray-100 hover:border-gray-200 bg-white'
                      }
                    `}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-[#009BA4] border-[#009BA4]' : 'border-gray-300'
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                        </div>
                        <span className="font-mono text-xs font-bold text-[#003D5C] flex-shrink-0">{doc.doc_number}</span>
                        <span className="text-xs text-gray-500 truncate">{doc.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs font-mono text-gray-400">{doc.current_revision}</span>
                        <StatutBadge code={doc.current_status} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Colonne droite : infos destinataire ────────────────────── */}
          <div className="w-72 flex flex-col px-5 pt-4 pb-4 gap-4 flex-shrink-0">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Destinataire</p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Nom / Société</label>
                  <input type="text" value={recipientName} onChange={e => setRecipientName(e.target.value)}
                    placeholder="Ex: Total Energies" className={inputCls} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Email</label>
                  <input type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="destinataire@exemple.com" className={inputCls} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">Note / Objet</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                rows={3} placeholder="Pour information, pour approbation..."
                className={`${inputCls} resize-none`} />
            </div>

            {/* Récap */}
            {selected.size > 0 && (
              <div className="bg-[#003D5C]/5 rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between font-semibold text-[#003D5C]">
                  <span>Bordereau</span>
                  <span className="font-mono">{btNumber}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Documents</span>
                  <span className="font-bold">{selected.size}</span>
                </div>
                {selectedDocs.some(d => {
                  const rev = d.kore_revisions?.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
                  return !rev?.file_hash;
                }) && (
                  <p className="text-amber-600 text-[10px] mt-1">
                    ⚠️ Certains documents n'ont pas de fichier attaché
                  </p>
                )}
              </div>
            )}

            {/* Bouton générer */}
            <button
              onClick={handleGenerate}
              disabled={generating || selected.size === 0}
              className="mt-auto w-full bg-[#003D5C] hover:bg-[#002A42] text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {generating
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Génération...</>
                : <><Download className="w-4 h-4" />Générer BT PDF</>
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
