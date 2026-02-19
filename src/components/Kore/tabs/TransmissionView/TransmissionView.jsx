// ═══════════════════════════════════════════════════════════════════════════
// KORE — TransmissionView
// Fix : React.Fragment key sur BtRow (deux <tr> dans un fragment)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Send, Plus, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { StatutBadge }          from '../../common/StatutBadge';
import { NewTransmissionModal } from './NewTransmissionModal';

function BtRow({ bt }) {
  const [expanded, setExpanded] = useState(false);
  const docs = bt.kore_transmission_docs || [];

  const date = new Date(bt.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    // Fragment avec key explicite — résout le warning "Each child in a list should have a unique key"
    <React.Fragment key={bt.id}>
      <tr
        className="hover:bg-blue-50/20 transition-colors group cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 font-mono font-bold text-[#003D5C] text-sm">{bt.bt_number}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{bt.recipient_name || <span className="text-gray-300">—</span>}</td>
        <td className="px-4 py-3 text-sm text-gray-500">{bt.recipient_email || <span className="text-gray-300">—</span>}</td>
        <td className="px-4 py-3 text-sm text-gray-500">{date}</td>
        <td className="px-4 py-3">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#003D5C]/10 text-[#003D5C]">
            {bt.doc_count} doc{bt.doc_count > 1 ? 's' : ''}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-[180px]">{bt.notes || '—'}</td>
        <td className="px-4 py-3 text-right">
          <button className="text-xs text-gray-400 hover:text-[#009BA4] flex items-center gap-1 ml-auto">
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {docs.length} ligne{docs.length > 1 ? 's' : ''}
          </button>
        </td>
      </tr>

      {expanded && docs.length > 0 && (
        <tr>
          <td colSpan={7} className="px-4 py-2 bg-[#003D5C]/2">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['N° Document', 'Désignation', 'Rév.', 'Statut', 'Signataires', 'SHA-256'].map(h => (
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {docs.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono font-bold text-[#003D5C]">{d.doc_number}</td>
                      <td className="px-3 py-2 text-gray-600 max-w-[220px] truncate">{d.doc_title}</td>
                      <td className="px-3 py-2 font-mono">{d.revision}</td>
                      <td className="px-3 py-2"><StatutBadge code={d.status} /></td>
                      <td className="px-3 py-2 text-gray-500">
                        {[
                          d.sig_redacteur    ? `R:${d.sig_redacteur.split(' ').pop()}`    : null,
                          d.sig_verificateur ? `V:${d.sig_verificateur.split(' ').pop()}` : null,
                          d.sig_approbateur  ? `A:${d.sig_approbateur.split(' ').pop()}`  : null,
                        ].filter(Boolean).join('  ') || '—'}
                        {d.sig_count > 0 && (
                          <span className="ml-1 text-emerald-600 font-bold">({d.sig_count}✓)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-[#009BA4]">
                        {d.file_hash
                          ? d.file_hash.slice(0, 16).toUpperCase() + '…'
                          : <span className="text-gray-300">—</span>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}

// ── Composant principal ─────────────────────────────────────────────────────

export function TransmissionView({ transmissions, docs, nextBtNumber, onCreateTransmission, notify, user, profile }) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
      {/* Header avec bouton */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#003D5C] flex items-center gap-2">
            <Send className="w-5 h-5 text-[#009BA4]" />
            Bordereaux de Transmission
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Diffusion formalisée de documents — BT-x HXAQ023
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003D5C] hover:bg-[#002A42] text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouveau BT
        </button>
      </div>

      {/* Table des transmissions */}
      {transmissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <Send className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun bordereau émis</p>
          <p className="text-gray-400 text-sm mt-1">
            Créez votre premier BT en sélectionnant des documents dans le registre
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-[#003D5C] text-white text-sm font-semibold rounded-xl hover:bg-[#002A42] transition-all"
          >
            Nouveau bordereau
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#003D5C] text-white">
                  {['N° BT', 'Destinataire', 'Email', 'Date', 'Documents', 'Note', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transmissions.map(bt => (
                  <BtRow key={bt.id} bt={bt} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <NewTransmissionModal
          docs={docs}
          nextBtNumber={nextBtNumber}
          onSave={onCreateTransmission}
          onClose={() => setShowModal(false)}
          notify={notify}
          user={user}
          profile={profile}
        />
      )}
    </div>
  );
}