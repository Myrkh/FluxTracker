// ═══════════════════════════════════════════════════════════════════════════
// KORE — DocumentRow
// v2.2 : téléchargement authentifié via onDownloadWithStamp
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Copy, History, ChevronDown, ChevronRight, Download, FileText, Shield, Lock } from 'lucide-react';
import { StatutBadge }    from '../../common/StatutBadge';
import { SignaturePills } from '../../common/SignaturePills';
import { shortHash, formatFileSize,  } from '../../../../services/Kore';

export function DocumentRow({ doc, isExpanded, onToggle, onAddRevision, onDownloadWithStamp, onSign }) {
  const [copiedId,    setCopiedId]    = useState(false);
  const [downloading, setDownloading] = useState(null); // revId en cours

  const revCount = doc.kore_revisions?.length || 0;

  const currentRev = doc.kore_revisions
    ?.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;

  const copyNum = () => {
    navigator.clipboard.writeText(doc.doc_number).then(() => {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 1500);
    });
  };

  const handleDownload = async (rev) => {
    setDownloading(rev.id);
    const { error } = await onDownloadWithStamp(doc, rev);
    if (error) console.error('[KORE] download error:', error);
    setDownloading(null);
  };

  const sortedRevisions = [...(doc.kore_revisions || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  return (
    <>
      {/* ── Ligne principale ─────────────────────────────────────────────── */}
      <tr className="hover:bg-blue-50/20 transition-colors group">

        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-xs font-bold text-[#003D5C] whitespace-nowrap">{doc.doc_number}</span>
            <button
              onClick={copyNum}
              className="text-gray-300 hover:text-[#009BA4] transition-colors opacity-0 group-hover:opacity-100"
              title="Copier"
            >
              <Copy className="w-3 h-3" />
            </button>
            {copiedId && <span className="text-xs text-[#009BA4] font-semibold">✓</span>}
          </div>
        </td>

        <td className="px-4 py-3 text-sm text-gray-700 max-w-[250px]">
          <span className="truncate block" title={doc.title}>{doc.title}</span>
        </td>

        <td className="px-4 py-3">
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#003D5C]/8 text-[#003D5C]">
            {doc.discipline_code}
          </span>
        </td>

        <td className="px-4 py-3 font-mono text-sm font-bold text-gray-700">{doc.current_revision}</td>
        <td className="px-4 py-3"><StatutBadge code={doc.current_status} /></td>

        <td className="px-4 py-3">
          <SignaturePills
            revision={currentRev}
            hasFile={!!currentRev?.file_path}
            onSign={(role, rev) => onSign(doc, rev || currentRev, role)}
          />
        </td>

        <td className="px-4 py-3">
          <button
            onClick={onToggle}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#009BA4] transition-colors"
          >
            <History className="w-3 h-3" />
            <span className="font-semibold">{revCount}</span>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
        </td>

        <td className="px-4 py-3 text-right">
          <button
            onClick={onAddRevision}
            className="text-xs px-3 py-1 rounded-lg bg-[#009BA4]/10 text-[#009BA4] hover:bg-[#009BA4] hover:text-white font-semibold transition-all"
          >
            + Révision
          </button>
        </td>
      </tr>

      {/* ── Historique dépliable ──────────────────────────────────────────── */}
      {isExpanded && revCount > 0 && (
        <tr>
          <td colSpan={8} className="px-4 py-3 bg-[#003D5C]/2">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['Rév.', 'Statut', 'Date', 'Rédacteur', 'Vérificateur', 'Approbateur', 'Objet', 'Fichier', 'Sigs', ''].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sortedRevisions.map(rev => (
                    <tr key={rev.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono font-bold text-[#003D5C]">{rev.revision}</td>
                      <td className="px-3 py-2"><StatutBadge code={rev.status} /></td>
                      <td className="px-3 py-2 text-gray-500 whitespace-nowrap">{rev.revision_date || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{rev.redacteur || rev.author || '—'}</td>
                      <td className="px-3 py-2 text-gray-500">{rev.verificateur || <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2 text-gray-500">{rev.approbateur  || <span className="text-gray-300">—</span>}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[160px] truncate">{rev.changes || '—'}</td>
                      <td className="px-3 py-2">
                        {rev.file_name ? (
                          <div className="flex items-center gap-1">
                            <FileText className="w-3 h-3 text-[#009BA4] flex-shrink-0" />
                            <span className="text-gray-600 truncate max-w-[90px]" title={rev.file_name}>
                              {rev.file_name}
                            </span>
                            {rev.file_size && <span className="text-gray-400">({formatFileSize(rev.file_size)})</span>}
                            {rev.file_hash && (
                              <span className="text-gray-300 font-mono text-[10px] flex items-center gap-0.5" title={`SHA-256: ${rev.file_hash}`}>
                                <Shield className="w-2.5 h-2.5" />{shortHash(rev.file_hash)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <SignaturePills
                          revision={rev}
                          hasFile={!!rev.file_path}
                          onSign={(role, r) => onSign(doc, r, role)}
                        />
                      </td>
                      <td className="px-3 py-2 text-right">
                        {/* Bouton téléchargement authentifié — actif même sans fichier (génère le certificat) */}
                        <button
                          onClick={() => handleDownload(rev)}
                          disabled={downloading === rev.id}
                          className={`
                            p-1.5 rounded-lg transition-all flex items-center gap-1
                            ${rev.file_path
                              ? 'text-[#009BA4] hover:bg-[#009BA4]/10'
                              : 'text-gray-300 hover:bg-gray-100'
                            }
                            disabled:opacity-40
                          `}
                          title={rev.file_path
                            ? 'Télécharger avec tampon d\'authenticité KORE'
                            : 'Générer le certificat d\'authenticité'
                          }
                        >
                          {downloading === rev.id ? (
                            <div className="w-3.5 h-3.5 border border-[#009BA4] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <Lock className="w-3 h-3" />
                              <Download className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}