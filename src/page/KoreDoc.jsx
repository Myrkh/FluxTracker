// ═══════════════════════════════════════════════════════════════════════════
// KORE v2.2 — Orchestrateur Principal
// + Tampon PDF authenticité (downloadWithStamp)
// + Onglet Transmissions BT-x
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { Plus, FileText, BarChart3, RefreshCw, Send } from 'lucide-react';

import { useAuth }            from '../lib/horizonData';
import AuthGate               from '../components/AuthGate';
import { useDocuments }       from '../hooks/Kore';
import { useNotification }    from '../hooks/Kore';
import { useTransmissions }   from '../hooks/Kore';

import { KoreHeader }         from '../components/Kore/common';
import { Toast }              from '../components/Kore/common';
import { NewDocumentForm }    from '../components/Kore/tabs/NewDocumentForm/NewDocumentForm';
import { RegisterView }       from '../components/Kore/tabs/RegisterView/RegisterView';
import { DashboardView }      from '../components/Kore/tabs/DashboardView/DashboardView';
import { TransmissionView }   from '../components/Kore/tabs/TransmissionView/TransmissionView';

const TABS = [
  { id: 'new',          label: 'Nouveau document', short: 'Nouveau',       icon: Plus      },
  { id: 'list',         label: 'Registre',         short: 'Registre',      icon: FileText  },
  { id: 'stats',        label: 'Dashboard',        short: 'Stats',         icon: BarChart3 },
  { id: 'transmissions',label: 'Transmissions',    short: 'BT-x',          icon: Send      },
];

export default function KoreApp() {
  const { user, profile, loading: authLoading, signIn, signUp, signOut } = useAuth();

  const {
    docs, loading,
    insertDoc, insertRevision,
    signRevision,
    downloadWithStamp,
    getFileUrl,
  } = useDocuments(user?.id);

  const {
    transmissions, loading: transLoading,
    nextBtNumber, createTransmission,
  } = useTransmissions(user?.id);

  const { notification, show: notify, clear: clearNotif } = useNotification();
  const [tab, setTab] = useState('new');

  // ── Créer document + révision initiale ───────────────────────────────
  const handleCreateDoc = useCallback(async (docData, revData, file = null) => {
    const { data, error } = await insertDoc(docData);
    if (error || !data) return { error };
    await insertRevision(data.id, revData, file);
    return { error: null };
  }, [insertDoc, insertRevision]);

  // ── Signer ────────────────────────────────────────────────────────────
  const handleSign = useCallback(async (signParams) => {
    return signRevision({
      ...signParams,
      userId:   user?.id,
      fullName: profile?.full_name || user?.email || 'Utilisateur',
    });
  }, [signRevision, user, profile]);

  // ── Téléchargement authentifié ────────────────────────────────────────
  const handleDownloadWithStamp = useCallback(async (doc, revision) => {
    const { error } = await downloadWithStamp(doc, revision);
    if (error) {
      notify('❌ Erreur téléchargement : ' + error.message, 'error');
    } else {
      notify('✅ Document authentifié téléchargé');
    }
    return { error };
  }, [downloadWithStamp, notify]);

  if (authLoading) return (
    <div className="min-h-screen bg-[#003D5C] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#009BA4] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#8BBCC8] text-sm">Chargement...</p>
      </div>
    </div>
  );

  if (!user) return <AuthGate signIn={signIn} signUp={signUp} appName="KORE" />;

  const isLoading = loading || transLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <KoreHeader user={user} profile={profile} signOut={signOut} docsCount={docs.length} />

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {TABS.map(({ id, label, short, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  tab === id
                    ? 'text-[#003D5C] border-[#009BA4] bg-[#009BA4]/5'
                    : 'text-gray-500 border-transparent hover:text-[#003D5C] hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
                <span className="md:hidden">{short}</span>
                {id === 'list' && docs.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-[#003D5C]/10 text-[#003D5C]">
                    {docs.length}
                  </span>
                )}
                {id === 'transmissions' && transmissions.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-[#009BA4]/10 text-[#009BA4]">
                    {transmissions.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Contenu */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-[#009BA4] animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'new' && (
              <NewDocumentForm docs={docs} onSubmit={handleCreateDoc} notify={notify} />
            )}
            {tab === 'list' && (
              <RegisterView
                docs={docs}
                onAddRevision={insertRevision}
                onDownloadWithStamp={handleDownloadWithStamp}
                onSign={handleSign}
                notify={notify}
                user={user}
                profile={profile}
              />
            )}
            {tab === 'stats' && (
              <DashboardView docs={docs} />
            )}
            {tab === 'transmissions' && (
              <TransmissionView
                transmissions={transmissions}
                docs={docs}
                nextBtNumber={nextBtNumber()}
                onCreateTransmission={createTransmission}
                notify={notify}
                user={user}
                profile={profile}
              />
            )}
          </>
        )}
      </main>

      <footer className="mt-12 border-t border-gray-200 py-6">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">
            KORE v2.2 · HXAQ023 Rév.10 · Signatures + Tampons SHA-256 + BT-x · Artelia Group
          </p>
          <a href="#/" className="text-xs text-[#009BA4] hover:text-[#003D5C] font-medium transition-colors">
            ← Retour au Hub Artelia
          </a>
        </div>
      </footer>

      {notification && (
        <Toast msg={notification.msg} type={notification.type} onClose={clearNotif} />
      )}
    </div>
  );
}