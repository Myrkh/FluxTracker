import React, { useState, useMemo } from 'react';
import { RefreshCw, Layers, LogOut, Home } from 'lucide-react';
import { useAuth } from '../lib/horizonData';

// Context & Hooks
import { AppContext } from '../context/OmniLink';
import { useReferenceData, useRecords, useNotification } from '../hooks/OmniLink';

// Components
import { NotificationToast } from '../components/OmniLink/common';
import { TABS } from '../constants/OmniLink';
import ImportViewComponent from '../components/OmniLink/ImportView';

// Tabs
import { 
  FormView, 
  ListView, 
  DashboardView, 
  CableScheduleView 
} from '../components/OmniLink/tabs';
import { LoopDiagramView } from '../components/OmniLink/tabs/LoopDiagramView/LoopDiagramView';
import { JBDiagramView } from '../components/OmniLink/tabs/JBDiagramView/JBDiagramView';

// Wrapper ImportView
function ImportView() {
  const { notify, recordOps } = React.useContext(AppContext);
  return <ImportViewComponent onBulkInsert={recordOps.bulkInsert} onNotify={notify} />;
}

export default function BaseINSApp() {
  const [activeTab, setActiveTab] = useState('form');
  const { user, signOut } = useAuth();
  
  const { refData, loading: refLoading, reload: reloadRef } = useReferenceData();
  const { records, loading: recordsLoading, stats, reload: reloadRecords, insert, update, remove, bulkInsert } = useRecords();
  const { notification, show: notify, clear: clearNotification } = useNotification();

  const ctx = useMemo(() => ({
    refData, records, stats, notify,
    recordOps: { insert, update, remove, bulkInsert, reload: reloadRecords },
    reloadRef,
  }), [refData, records, stats, notify, insert, update, remove, bulkInsert, reloadRecords, reloadRef]);

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        
        {/* ── HEADER ── */}
        <header className="bg-gradient-to-br from-[#00375A] via-[#004A73] to-[#0091D5] shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
              backgroundSize: '40px 40px'
            }} />
          </div>
          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/10 backdrop-blur-sm p-3 rounded-xl">
                  <Layers className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">OmniLink</h1>
                  <p className="text-[#00B4D8]/90 text-sm font-medium mt-0.5">
                    Artelia • Gestion Instrumentation & Câblage • GS RC INS 107
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center space-x-4">
                {user && (
                  <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                    <span className="text-white text-sm font-medium">{user.email}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${refLoading || recordsLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                  <span className="text-white text-sm font-medium">{records.length} points</span>
                </div>
                <button onClick={() => { reloadRef(); reloadRecords(); }}
                  className="p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
                  title="Rafraîchir">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <a href="/#/home"
                  className="p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
                  title="Accueil">
                  <Home className="w-4 h-4" />
                </a>
                {user && (
                  <button onClick={signOut}
                    className="p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
                    title="Déconnexion">
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── TAB NAVIGATION ── */}
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-0.5 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`relative px-4 lg:px-6 py-3.5 font-medium text-sm transition-all duration-200 flex items-center space-x-2 whitespace-nowrap border-b-2 ${
                      isActive
                        ? 'text-[#00375A] border-[#00375A] bg-[#00375A]/5'
                        : 'text-gray-500 border-transparent hover:text-[#00375A] hover:bg-gray-50'
                    }`}>
                    <Icon className="w-4 h-4" />
                    <span className="hidden md:inline">{tab.label}</span>
                    <span className="md:hidden">{tab.shortLabel}</span>
                    {tab.id === 'list' && records.length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-[#00375A]/10 text-[#00375A]">
                        {records.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* ── NOTIFICATION ── */}
        <NotificationToast notification={notification} onClose={clearNotification} />

        {/* ── MAIN CONTENT ── */}
        <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'form' && <FormView />}
          {activeTab === 'import' && <ImportView />}
          {activeTab === 'list' && <ListView />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'loop' && <LoopDiagramView />}
          {activeTab === 'jb' && <JBDiagramView />}
          {activeTab === 'cables' && <CableScheduleView />}
        </main>

        {/* ── FOOTER ── */}
        <footer className="mt-12 border-t border-gray-200 py-6 text-center text-sm text-gray-400">
          <p>OmniLink v2.0 — Artelia Engineering • Standard GS RC INS 107</p>
        </footer>
      </div>
    </AppContext.Provider>
  );
}
