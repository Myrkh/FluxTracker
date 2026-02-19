// ═══════════════════════════════════════════════════════════════════════════
// KORE — RegisterView
// Fix : prop renommée onDownloadFile → onDownloadWithStamp + passage à DocumentRow
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import { Search, FileText, Download } from 'lucide-react';
import { DISCIPLINES, STATUTS }   from '../../../../constants/Kore';
import { exportRegistreExcel }    from '../../../../services/Kore';
import { DocumentRow }            from './DocumentRow';
import { RevisionModal }          from './RevisionModal';
import { SignatureModal }         from './SignatureModal';

export function RegisterView({ docs, onAddRevision, onDownloadWithStamp, onSign, notify, user, profile }) {
  const [search,       setSearch]       = useState('');
  const [filterDisc,   setFilterDisc]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId,   setExpandedId]   = useState(null);
  const [revModal,     setRevModal]     = useState(null);
  const [sigModal,     setSigModal]     = useState(null);
  const [exporting,    setExporting]    = useState(false);

  const filtered = useMemo(() => docs.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || d.doc_number.toLowerCase().includes(q)
      || d.title?.toLowerCase().includes(q);
    const matchDisc   = filterDisc   === 'all' || d.discipline_code === filterDisc;
    const matchStatus = filterStatus === 'all' || d.current_status  === filterStatus;
    return matchSearch && matchDisc && matchStatus;
  }), [docs, search, filterDisc, filterStatus]);

  const handleExport = useCallback(async () => {
    if (docs.length === 0) { notify('Aucun document à exporter', 'warn'); return; }
    setExporting(true);
    try {
      await exportRegistreExcel(docs);
      notify(`✅ Export Excel — ${docs.length} document${docs.length > 1 ? 's' : ''}`);
    } catch (err) {
      notify('❌ Erreur export : ' + err.message, 'error');
    } finally {
      setExporting(false);
    }
  }, [docs, notify]);

  const handleSignRequest = useCallback((doc, revision, role) => {
    if (!user) { notify('Vous devez être connecté pour signer', 'error'); return; }
    setSigModal({ doc, revision, role });
  }, [user, notify]);

  const inputCls = 'border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none';

  return (
    <div>
      {/* ── Barre filtres + export ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher N° ou désignation..."
            className={`w-full pl-9 ${inputCls}`}
          />
        </div>

        <select value={filterDisc} onChange={e => setFilterDisc(e.target.value)} className={inputCls}>
          <option value="all">Toutes disciplines</option>
          {Object.entries(DISCIPLINES).map(([k, v]) => (
            <option key={k} value={k}>{k} — {v.slice(0, 28)}</option>
          ))}
        </select>

        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls}>
          <option value="all">Tous statuts</option>
          {Object.entries(STATUTS).map(([k, v]) => (
            <option key={k} value={k}>{k} — {v}</option>
          ))}
        </select>

        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
          {filtered.length} / {docs.length}
        </span>

        <button
          onClick={handleExport} disabled={exporting || docs.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#003D5C] hover:bg-[#002A42] text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50 whitespace-nowrap"
        >
          <Download className="w-4 h-4" />
          {exporting ? 'Export...' : 'Exporter Excel'}
        </button>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">
            {docs.length === 0 ? 'Aucun document' : 'Aucun résultat'}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {docs.length === 0
              ? 'Créez votre premier document dans l\'onglet "Nouveau"'
              : 'Essayez d\'élargir votre recherche'
            }
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#003D5C] text-white">
                  {['N° Document', 'Désignation', 'Disc.', 'Rév.', 'Statut', 'Signatures', 'Historique', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(doc => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    isExpanded={expandedId === doc.id}
                    onToggle={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                    onAddRevision={() => setRevModal(doc)}
                    onDownloadWithStamp={onDownloadWithStamp}
                    onSign={handleSignRequest}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {revModal && (
        <RevisionModal
          doc={revModal}
          onClose={() => setRevModal(null)}
          onSave={onAddRevision}
          notify={notify}
        />
      )}

      {sigModal && (
        <SignatureModal
          doc={sigModal.doc}
          revision={sigModal.revision}
          role={sigModal.role}
          user={user}
          profile={profile}
          onSign={onSign}
          onClose={() => setSigModal(null)}
          notify={notify}
        />
      )}
    </div>
  );
}