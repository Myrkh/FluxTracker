// ═══════════════════════════════════════════════════════════════════════════
// KORE — RegisterView
// v2 : Bouton reset filtres + tri par colonne (clic en-tête)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useCallback } from 'react';
import { Search, FileText, Download, X, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { DISCIPLINES, STATUTS }   from '../../../constants';
import { exportRegistreExcel }    from '../../../services';
import { DocumentRow }            from './DocumentRow';
import { RevisionModal }          from './RevisionModal';
import { SignatureModal }         from './SignatureModal';

// ── Colonnes triables ─────────────────────────────────────────────────────
const SORT_COLS = {
  doc_number:      (d) => d.doc_number,
  title:           (d) => d.title || '',
  discipline_code: (d) => d.discipline_code || '',
  current_status:  (d) => d.current_status  || '',
  current_revision:(d) => {
    // Tri numérique si c'est un nombre, alphabétique sinon
    const n = parseInt(d.current_revision, 10);
    return isNaN(n) ? d.current_revision || '' : n;
  },
};

// ── Icône de tri ──────────────────────────────────────────────────────────
function SortIcon({ col, sortCol, sortDir }) {
  if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-30 inline" />;
  return sortDir === 'asc'
    ? <ArrowUp   className="w-3 h-3 ml-1 text-[#009BA4] inline" />
    : <ArrowDown className="w-3 h-3 ml-1 text-[#009BA4] inline" />;
}

export function RegisterView({ docs, onAddRevision, onDownloadWithStamp, onSign, notify, user, profile }) {
  const [search,       setSearch]       = useState('');
  const [filterDisc,   setFilterDisc]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId,   setExpandedId]   = useState(null);
  const [revModal,     setRevModal]     = useState(null);
  const [sigModal,     setSigModal]     = useState(null);
  const [exporting,    setExporting]    = useState(false);
  const [sortCol,      setSortCol]      = useState('doc_number');
  const [sortDir,      setSortDir]      = useState('asc');

  // ── Filtres actifs ────────────────────────────────────────────────────
  const hasActiveFilters = search !== '' || filterDisc !== 'all' || filterStatus !== 'all';

  const resetFilters = useCallback(() => {
    setSearch('');
    setFilterDisc('all');
    setFilterStatus('all');
  }, []);

  // ── Clic sur en-tête colonne ──────────────────────────────────────────
  const handleSort = useCallback((col) => {
    if (col === sortCol) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  }, [sortCol]);

  // ── Filtrage + tri ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const result = docs.filter(d => {
      const matchSearch = !q
        || d.doc_number.toLowerCase().includes(q)
        || d.title?.toLowerCase().includes(q);
      const matchDisc   = filterDisc   === 'all' || d.discipline_code === filterDisc;
      const matchStatus = filterStatus === 'all' || d.current_status  === filterStatus;
      return matchSearch && matchDisc && matchStatus;
    });

    // Tri
    const getter = SORT_COLS[sortCol];
    if (getter) {
      result.sort((a, b) => {
        const va = getter(a);
        const vb = getter(b);
        if (va < vb) return sortDir === 'asc' ? -1 :  1;
        if (va > vb) return sortDir === 'asc' ?  1 : -1;
        return 0;
      });
    }

    return result;
  }, [docs, search, filterDisc, filterStatus, sortCol, sortDir]);

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

  // ── En-tête de colonne cliquable ──────────────────────────────────────
  const Th = ({ col, children, className = '' }) => (
    <th
      onClick={col ? () => handleSort(col) : undefined}
      className={`px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap
        ${col ? 'cursor-pointer hover:bg-[#002A42] select-none' : ''}
        ${className}`}
    >
      {children}
      {col && <SortIcon col={col} sortCol={sortCol} sortDir={sortDir} />}
    </th>
  );

  return (
    <div>
      {/* ── Barre filtres + export ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        {/* Recherche texte libre */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher N° ou désignation..."
            className={`w-full pl-9 ${inputCls}`}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filtre discipline */}
        <select value={filterDisc} onChange={e => setFilterDisc(e.target.value)} className={inputCls}>
          <option value="all">Toutes disciplines</option>
          {Object.entries(DISCIPLINES).map(([k, v]) => (
            <option key={k} value={k}>{k} — {v.slice(0, 28)}</option>
          ))}
        </select>

        {/* Filtre statut */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls}>
          <option value="all">Tous statuts</option>
          {Object.entries(STATUTS).map(([k, v]) => (
            <option key={k} value={k}>{k} — {v}</option>
          ))}
        </select>

        {/* Bouton reset — visible uniquement si un filtre est actif */}
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-500 hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-all"
            title="Réinitialiser tous les filtres"
          >
            <X className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
        )}

        {/* Compteur */}
        <span className="text-xs text-gray-400 font-medium whitespace-nowrap">
          {filtered.length} / {docs.length}
        </span>

        {/* Export */}
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
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 text-sm font-medium text-[#009BA4] hover:underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#003D5C] text-white">
                  <Th col="doc_number">N° Document</Th>
                  <Th col="title">Désignation</Th>
                  <Th col="discipline_code">Disc.</Th>
                  <Th col="current_revision">Rév.</Th>
                  <Th col="current_status">Statut</Th>
                  <Th>Signatures</Th>
                  <Th>Historique</Th>
                  <Th>Actions</Th>
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