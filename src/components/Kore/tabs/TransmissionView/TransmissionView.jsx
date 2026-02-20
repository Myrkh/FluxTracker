// ═══════════════════════════════════════════════════════════════════════════
// KORE — TransmissionView
// v3 : intégration NotificationService → upload ZIP + email Resend
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Send, Plus, ChevronDown, ChevronRight, Download, RefreshCw, Archive, Mail } from 'lucide-react';
import { StatutBadge }          from '../../common/StatutBadge';
import { NewTransmissionModal } from './NewTransmissionModal';
import { generateBordereauPdf } from '../../../../services/Kore/BtxService';
import { generateBtZip }        from '../../../../services/Kore/ZipService';
import { NotificationService }  from '../../../../services/Kore/NotificationService';

// ── Barre de progression ─────────────────────────────────────────────────
function ZipProgress({ pct, label }) {
  return (
    <div className="mt-2 px-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-[#009BA4] font-medium truncate">{label}</span>
        <span className="text-xs font-bold text-[#003D5C] ml-2">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div
          className="bg-[#009BA4] h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Ligne BT ─────────────────────────────────────────────────────────────
function BtRow({ bt, user, profile, getFileUrl, notify }) {
  const [expanded,    setExpanded]    = useState(false);
  const [dlBordereau, setDlBordereau] = useState(false);
  const [zipState,    setZipState]    = useState({ active: false, pct: 0, label: '' });

  const docs = bt.kore_transmission_docs || [];
  const date = new Date(bt.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  // ── Re-télécharger bordereau PDF ─────────────────────────────────────
  const handleRedownloadBordereau = async (e) => {
    e.stopPropagation();
    setDlBordereau(true);
    try {
      const btData = {
        bt_number:       bt.bt_number,
        recipient_name:  bt.recipient_name,
        recipient_email: bt.recipient_email,
        notes:           bt.notes,
      };
      const pdfBytes = await generateBordereauPdf(btData, docs, user, profile);
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `${bt.bt_number}_Bordereau_Artelia.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('[KORE] BT bordereau re-download error:', err);
      notify?.('Erreur lors du re-téléchargement du bordereau', 'error');
    } finally {
      setDlBordereau(false);
    }
  };

  // ── ZIP complet + upload Storage + email ─────────────────────────────
  const handleDownloadZip = async (e) => {
    e.stopPropagation();
    setZipState({ active: true, pct: 0, label: 'Initialisation...' });
    try {
      const btData = {
        bt_number:       bt.bt_number,
        recipient_name:  bt.recipient_name,
        recipient_email: bt.recipient_email,
        notes:           bt.notes,
      };

      // 1. Générer le ZIP
      const zipBlob = await generateBtZip(
        btData,
        docs,
        user,
        profile,
        getFileUrl,
        (pct, label) => setZipState({ active: true, pct: Math.min(pct, 85), label })
      );

      // 2. Télécharger localement
      const url = URL.createObjectURL(zipBlob);
      const a   = document.createElement('a');
      a.href    = url;
      a.download = `${bt.bt_number}_Artelia.zip`;
      a.click();
      URL.revokeObjectURL(url);

      // 3. Upload Storage + email via NotificationService (si destinataire défini)
      if (bt.recipient_email) {
        setZipState({ active: true, pct: 90, label: 'Envoi email...' });
        await NotificationService.onBtCreated({
          btData: {
            bt_number:       bt.bt_number,
            recipient_email: bt.recipient_email,
            recipient_name:  bt.recipient_name,
            notes:           bt.notes,
          },
          snapDocs: docs,
          zipBlob,
          user,
          profile,
        });
        notify?.(`ZIP envoyé à ${bt.recipient_email}`);
      }

      setZipState({ active: true, pct: 100, label: 'Terminé !' });
    } catch (err) {
      console.error('[KORE] BT ZIP error:', err);
      notify?.('Erreur lors de la génération du ZIP', 'error');
    } finally {
      setTimeout(() => setZipState({ active: false, pct: 0, label: '' }), 1200);
    }
  };

  return (
    <React.Fragment key={bt.id}>
      <tr
        className="hover:bg-blue-50/20 transition-colors cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <td className="px-4 py-3 font-mono font-bold text-[#003D5C] text-sm whitespace-nowrap">
          {bt.bt_number}
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {bt.recipient_name || <span className="text-gray-300">—</span>}
        </td>
        <td className="px-4 py-3 text-sm text-gray-500">
          {bt.recipient_email
            ? <span className="flex items-center gap-1"><Mail className="w-3 h-3 text-gray-300" />{bt.recipient_email}</span>
            : <span className="text-gray-300">—</span>
          }
        </td>
        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">{date}</td>
        <td className="px-4 py-3">
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#003D5C]/10 text-[#003D5C]">
            {bt.doc_count} doc{bt.doc_count > 1 ? 's' : ''}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-400 truncate max-w-[160px]">
          {bt.notes || <span className="text-gray-200">—</span>}
        </td>

        {/* Actions */}
        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
          <div className="flex items-center gap-1.5 justify-end">

            {/* Bordereau PDF */}
            <button
              onClick={handleRedownloadBordereau}
              disabled={dlBordereau}
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#003D5C] hover:bg-gray-100 transition-all disabled:opacity-40"
              title="Re-télécharger le bordereau PDF"
            >
              {dlBordereau ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            </button>

            {/* ZIP + email */}
            <button
              onClick={handleDownloadZip}
              disabled={zipState.active}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#003D5C] hover:bg-[#002A42] text-white text-xs font-semibold transition-all disabled:opacity-50"
              title={bt.recipient_email
                ? `Télécharger ZIP + envoyer à ${bt.recipient_email}`
                : 'Télécharger ZIP'
              }
            >
              {zipState.active
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Archive className="w-3.5 h-3.5" />
              }
              <span>{zipState.active ? `${zipState.pct}%` : 'ZIP'}</span>
              {!zipState.active && bt.recipient_email && (
                <Mail className="w-3 h-3 opacity-60" />
              )}
            </button>

            {/* Toggle détail */}
            <button
              className="text-xs text-gray-400 hover:text-[#009BA4] flex items-center gap-1 ml-1"
              onClick={() => setExpanded(v => !v)}
            >
              {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              {docs.length}
            </button>
          </div>

          {zipState.active && (
            <ZipProgress pct={zipState.pct} label={zipState.label} />
          )}
        </td>
      </tr>

      {/* Détail documents */}
      {expanded && docs.length > 0 && (
        <tr>
          <td colSpan={7} className="px-4 py-2 bg-gray-50/50">
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    {['N° Document', 'Désignation', 'Rév.', 'Statut', 'Signataires', 'Fichier', 'SHA-256'].map(h => (
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
                      <td className="px-3 py-2 font-mono text-gray-600">{d.revision}</td>
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
                      <td className="px-3 py-2 text-gray-400">
                        {d.file_name
                          ? <span className="text-[#009BA4]">{d.file_name}</span>
                          : <span className="text-gray-300">Sans fichier</span>
                        }
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

// ── Composant principal ──────────────────────────────────────────────────
export function TransmissionView({
  transmissions, docs, nextBtNumber,
  onCreateTransmission, notify,
  user, profile, getFileUrl,
}) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div>
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
                  {['N° BT', 'Destinataire', 'Email', 'Date', 'Documents', 'Note', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transmissions.map(bt => (
                  <BtRow
                    key={bt.id}
                    bt={bt}
                    user={user}
                    profile={profile}
                    getFileUrl={getFileUrl}
                    notify={notify}
                  />
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