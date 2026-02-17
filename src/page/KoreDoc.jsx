import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/horizonData';
import AuthGate from '../components/AuthGate';
import {
  Plus, Search, FileText, Clock, CheckCircle2, AlertCircle, RefreshCw,
  ChevronDown, ChevronRight, History, Download, Eye, Home, LogOut,
  AlertTriangle, Copy, X, Filter, BarChart3, Layers
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════════════════════
// RÉFÉRENTIELS HXAQ023 — Single Source of Truth
// ══════════════════════════════════════════════════════════════════════════════

const CENTRES_PROFIT = {
  A:'Saint-Nazaire', C:'Cherbourg', D:'Dunkerque', F:'Maubeuge',
  G:'Port Jérôme sur Seine', H:'Le Havre', J:'Pierrelatte', K:'Caen',
  L:'Lyon', M:'Martigues', P:'Paris', Q:'Châtellerault/Le Mans',
  R:'Rouen', S:'Monthey (CH)', T:'Tarbes', U:'Mulhouse', V:'Saint-Avold',
};

const ANNEES = { E:2018,F:2019,G:2020,H:2021,I:2022,J:2023,K:2024,L:2025,M:2026 };

const DISCIPLINES = {
  PJT:'Général projet / Planning / Plan qualité',
  ADM:'Administratif / Contrat',
  COS:'Estimation budgétaire / Cost-Control',
  HSE:'HSE / Sécurité / HAZOP',
  PRC:'Achats / Procurement',
  CST:'Construction / Chantier',
  COM:'Précommissioning / Commissioning',
  RAD:'Sûreté / Radioprotection',
  PRO:'Procédé / Process',
  COR:'Maîtrise de la corrosion',
  GCV:'Génie civil / VRD / Fondations',
  STR:'Charpente / Steel structure',
  BAT:'Bâtiment / Architecture',
  EQC:'Équipements Chaudronnés',
  EQM:'Équipements Mécaniques',
  EQT:'Équipements Thermiques',
  EQD:'Équipements Divers',
  PIP:'Canalisation / Tuyauterie / Pipeline',
  EIA:'EIA (documents communs)',
  ELE:'Électricité (tous courants)',
  ELF:'Électricité (courants forts)',
  INS:'Instrumentation / Télécommunications',
  AUT:'Automatisme',
  ANA:'Analyseurs',
  HVA:'CVC / Ventilation / Climatisation',
  MEC:'Mécanique (outillage / machines spéciales)',
};

const STATUTS = {
  PRE:'Préliminaire',
  IFR:'Émis pour Revue / Commentaires',
  INF:'Émis pour Information',
  IFA:'Émis pour Approbation',
  IFI:'Émis pour Consultation',
  IFP:'Émis pour Achat',
  IFD:'Émis pour Exécution',
  IFC:'Émis pour Construction',
  ASB:'Tel Que Construit (As Built)',
  FIN:'Documentation Finale',
  CLD:'Annulé',
};

const STATUT_COLORS = {
  PRE:'bg-gray-100 text-gray-600',
  IFR:'bg-yellow-100 text-yellow-700',
  INF:'bg-blue-100 text-blue-700',
  IFA:'bg-orange-100 text-orange-700',
  IFI:'bg-purple-100 text-purple-700',
  IFP:'bg-pink-100 text-pink-700',
  IFD:'bg-indigo-100 text-indigo-700',
  IFC:'bg-green-100 text-green-700',
  ASB:'bg-teal-100 text-teal-700',
  FIN:'bg-emerald-100 text-emerald-700',
  CLD:'bg-red-100 text-red-500 line-through',
};

const SUFFIXES = {
  '':'Aucun suffixe',
  RQT:'Réquisition technique',    RQC:'Réquisition commerciale',
  LIF:'Liste des fournisseurs',    TCO:'Tableaux comparatifs',
  PID:'Plan de circulation des Fluides (PID)', LPD:'Schéma de boucle',
  WIR:'Schémas de câblage',       ISO:'Isométrique',
  CAL:'Notes de calcul',          TNO:'Note technique',
  MOM:'Compte rendu de réunion',  LST:'Liste / Index',
  SPE:'Spécification matériel',   SPG:'Spécification générale',
  DTS:'Data-sheet',               REP:'Rapport / Synthèse',
  MTO:'Métré de matériel',        PLG:'Planning',
  PAQ:'Plan Qualité',             MAN:'Manuel opératoire',
  FOR:'Forme / Gabarit',          DWG:'Plan guide',
  DWD:'Plan de détail',           GEA:'Plan d\'ensemble',
  SLD:'Synoptique des liaisons',  PFD:'Process Flow Diagram',
  BLD:'Block diagram',            TYP:'Plans et schémas type',
  REX:'Retour d\'expérience',     MRE:'Rapport mensuel',
  WRE:'Rapport hebdomadaire',
};

// ══════════════════════════════════════════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════════════════════════════════════════

/** Jaccard similarity sur tokens — détection de désignations similaires */
function computeSimilarity(a, b) {
  const tokenize = s => s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/).filter(t => t.length > 2);
  const setA = new Set(tokenize(a));
  const setB = new Set(tokenize(b));
  if (!setA.size || !setB.size) return 0;
  const inter = [...setA].filter(t => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  return inter / union;
}

/** Génère le N° complet selon HXAQ023 */
function buildDocNumber(project, emitter, unit, discipline, sequence, suffix) {
  const parts = [project];
  if (emitter && emitter !== 'ART') parts.push(emitter);
  if (unit && unit !== '000') parts.push(unit);
  parts.push(discipline);
  parts.push(String(sequence).padStart(4, '0'));
  if (suffix) parts.push(suffix);
  return parts.join('-');
}

/** Génère le N° d'affaire */
function buildProjectNumber(centre, distinctif, annee, ordre) {
  return `${centre}${distinctif}${annee}${String(ordre).padStart(3,'0')}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// HOOKS SUPABASE
// ══════════════════════════════════════════════════════════════════════════════

function useKoreDocuments(userId) {
  const [docs, setDocs]       = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setDocs([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('kore_documents')
      .select('*, kore_revisions(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    setDocs(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const insertDoc = async (doc) => {
    const { data, error } = await supabase
      .from('kore_documents')
      .insert({ ...doc, user_id: userId })
      .select('*, kore_revisions(*)')
      .single();
    if (!error) setDocs(prev => [data, ...prev]);
    return { data, error };
  };

  const insertRevision = async (docId, rev) => {
    const { data: revData, error } = await supabase
      .from('kore_revisions')
      .insert({ ...rev, document_id: docId })
      .select().single();
    if (!error) {
      // Mettre à jour current_revision + current_status dans kore_documents
      await supabase.from('kore_documents')
        .update({ current_revision: rev.revision, current_status: rev.status })
        .eq('id', docId);
      setDocs(prev => prev.map(d => d.id === docId
        ? { ...d, current_revision: rev.revision, current_status: rev.status,
            kore_revisions: [...(d.kore_revisions || []), revData] }
        : d
      ));
    }
    return { error };
  };

  return { docs, loading, reload: load, insertDoc, insertRevision };
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPOSANTS UI
// ══════════════════════════════════════════════════════════════════════════════

const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 ${
      type === 'error' ? 'bg-red-600 text-white' : type === 'warn' ? 'bg-amber-500 text-white' : 'bg-[#009BA4] text-white'
    }`}>
      {type === 'error' ? <AlertCircle className="w-4 h-4" /> : type === 'warn' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
      {msg}
    </div>
  );
};

/** Badge statut coloré */
const StatutBadge = ({ code }) => (
  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${STATUT_COLORS[code] || 'bg-gray-100 text-gray-600'}`}>
    {code}
  </span>
);

/** Header commun Artelia */
const KoreHeader = ({ user, profile, signOut, docsCount }) => (
  <header className="bg-gradient-to-r from-[#003D5C] to-[#005078] shadow-xl">
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a href="#/" className="flex-shrink-0 group">
            <img src="/logo-artelia.png" alt="Artelia" className="h-9 object-contain group-hover:opacity-80 transition-opacity"
              style={{ filter: 'brightness(0) invert(1)' }}
              onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='block'; }}
            />
            <svg style={{ display:'none' }} width="100" height="28" viewBox="0 0 180 56" fill="none">
              <polygon points="4,48 22,8 40,48" fill="none" stroke="#009BA4" strokeWidth="4.5" strokeLinejoin="round"/>
              <line x1="11" y1="36" x2="33" y2="36" stroke="#009BA4" strokeWidth="4.5" strokeLinecap="round"/>
              <text x="52" y="40" fontFamily="Inter,sans-serif" fontSize="28" fontWeight="700" fill="white">artelia</text>
            </svg>
          </a>
          <div className="w-px h-8 bg-white/20" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">KORE</h1>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#009BA4] text-white font-semibold">HXAQ023</span>
            </div>
            <p className="text-xs text-[#8BBCC8]">Gestion Documentaire Projet · {docsCount} document{docsCount > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background:'rgba(0,155,164,0.15)', color:'#009BA4', border:'1px solid rgba(0,155,164,0.3)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#009BA4] animate-pulse" />
              <span>{profile?.full_name || user.email?.split('@')[0]}</span>
            </div>
          )}
          {user && (
            <button onClick={signOut}
              className="p-2 bg-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all" title="Déconnecter">
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <a href="#/" className="p-2 bg-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all" title="Accueil">
            <Home className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  </header>
);

// ══════════════════════════════════════════════════════════════════════════════
// VUE : NOUVEAU DOCUMENT
// ══════════════════════════════════════════════════════════════════════════════

function NewDocumentForm({ docs, onSubmit, notify }) {
  const [step, setStep]           = useState(1); // 1=N° affaire, 2=Codif, 3=Détails
  const [similar, setSimilar]     = useState([]);
  const [previewNum, setPreviewNum] = useState('');

  // Étape 1 — N° affaire
  const [centre, setCentre]       = useState('H');
  const [distinctif, setDistinctif] = useState('T');
  const [annee, setAnnee]         = useState('L');
  const [ordre, setOrdre]         = useState('001');

  // Étape 2 — Codification
  const [emitter, setEmitter]     = useState('');
  const [unit, setUnit]           = useState('');
  const [discipline, setDiscipline] = useState('INS');
  const [sequence, setSequence]   = useState('');
  const [suffix, setSuffix]       = useState('');

  // Étape 3 — Détails
  const [title, setTitle]         = useState('');
  const [revision, setRevision]   = useState('0');
  const [statut, setStatut]       = useState('PRE');
  const [author, setAuthor]       = useState('');
  const [changes, setChanges]     = useState('Création initiale');
  const [loading, setLoading]     = useState(false);

  // Auto-calculer le prochain numéro de séquence
  const projectNum = buildProjectNumber(centre, distinctif, annee, ordre);
  
  useEffect(() => {
    const existing = docs.filter(d =>
      d.project_number === projectNum && d.discipline_code === discipline
    );
    const maxSeq = existing.reduce((m, d) => Math.max(m, d.sequence_number || 0), 0);
    setSequence(String(maxSeq + 1).padStart(4, '0'));
  }, [docs, projectNum, discipline]);

  // Preview du numéro
  useEffect(() => {
    const num = buildDocNumber(projectNum, emitter, unit, discipline, parseInt(sequence) || 1, suffix);
    setPreviewNum(num);
  }, [projectNum, emitter, unit, discipline, sequence, suffix]);

  // Détection de doublons intelligente (Jaccard ≥ 0.35 + même discipline)
  useEffect(() => {
    if (!title || title.length < 5) { setSimilar([]); return; }
    const found = docs.filter(d =>
      d.discipline_code === discipline &&
      computeSimilarity(title, d.title) >= 0.35
    ).map(d => ({ ...d, score: Math.round(computeSimilarity(title, d.title) * 100) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    setSimilar(found);
  }, [title, discipline, docs]);

  const handleSubmit = async () => {
    if (!title.trim() || !author.trim()) { notify('Désignation et auteur obligatoires', 'error'); return; }
    // Vérifier unicité du N°
    if (docs.find(d => d.doc_number === previewNum)) {
      notify(`❌ Le N° ${previewNum} existe déjà !`, 'error'); return;
    }
    setLoading(true);
    const { error } = await onSubmit({
      doc_number:       previewNum,
      project_number:   projectNum,
      emitter_code:     emitter || null,
      unit_code:        unit || null,
      discipline_code:  discipline,
      discipline_label: DISCIPLINES[discipline],
      suffix_code:      suffix || null,
      sequence_number:  parseInt(sequence) || 1,
      title:            title.trim(),
      current_revision: revision,
      current_status:   statut,
    }, {
      revision, status: statut, author: author.trim(),
      changes: changes.trim() || 'Création initiale',
      revision_date: new Date().toISOString().split('T')[0],
    });
    setLoading(false);
    if (error) { notify('❌ Erreur création : ' + error.message, 'error'); return; }
    notify(`✅ Document ${previewNum} créé !`);
    setTitle(''); setAuthor(''); setChanges('Création initiale'); setStep(1);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {[['1','N° Affaire'],['2','Codification'],['3','Détails']].map(([s, label], i) => (
          <React.Fragment key={s}>
            <button onClick={() => setStep(parseInt(s))}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                step === parseInt(s)
                  ? 'bg-[#003D5C] text-white shadow'
                  : step > parseInt(s)
                    ? 'bg-[#009BA4]/10 text-[#009BA4] hover:bg-[#009BA4]/20'
                    : 'bg-white text-gray-400 border border-gray-100'
              }`}>
              <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
                step > parseInt(s) ? 'bg-[#009BA4] text-white' : step === parseInt(s) ? 'bg-white text-[#003D5C]' : 'bg-gray-200 text-gray-500'
              }`}>{step > parseInt(s) ? '✓' : s}</span>
              {label}
            </button>
            {i < 2 && <div className={`flex-1 h-0.5 mx-1 ${step > i + 1 ? 'bg-[#009BA4]' : 'bg-gray-200'}`} />}
          </React.Fragment>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* ── ÉTAPE 1 : N° d'affaire ── */}
        {step === 1 && (
          <div className="p-6">
            <h3 className="text-base font-bold text-[#003D5C] mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#009BA4]" /> N° d'affaire (HXAQ023 §2.1)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Centre de profit *
                </label>
                <select value={centre} onChange={e => setCentre(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none">
                  {Object.entries(CENTRES_PROFIT).map(([k,v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Code distinctif *
                </label>
                <select value={distinctif} onChange={e => setDistinctif(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none">
                  {[['T','Tous Corps d\'État'],['E','EIA'],['M','Mécanique'],['R','Procédé'],['I','Atelier'],
                    ['B','Belgique'],['C','Brest'],['G','Grenoble']].map(([k,v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Année *
                </label>
                <select value={annee} onChange={e => setAnnee(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none">
                  {Object.entries(ANNEES).map(([k,v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  N° ordre *
                </label>
                <input type="text" value={ordre} onChange={e => setOrdre(e.target.value.replace(/\D/g,'').padStart(3,'0').slice(-3))}
                  maxLength={3} placeholder="001"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none font-mono" />
              </div>
            </div>
            <div className="bg-[#003D5C]/5 rounded-xl p-4 mb-6 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#009BA4] flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">N° d'affaire généré</p>
                <p className="text-xl font-bold font-mono text-[#003D5C]">{projectNum}</p>
              </div>
            </div>
            <button onClick={() => setStep(2)}
              className="w-full bg-[#009BA4] hover:bg-[#007A82] text-white font-semibold py-2.5 rounded-xl transition-colors">
              Suivant : Codification →
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 : Codification document ── */}
        {step === 2 && (
          <div className="p-6">
            <h3 className="text-base font-bold text-[#003D5C] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#009BA4]" /> Codification du document (§2.2)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Code Métier / Discipline <span className="text-red-500">*</span>
                </label>
                <select value={discipline} onChange={e => setDiscipline(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none">
                  {Object.entries(DISCIPLINES).map(([k,v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Suffixe (facultatif)
                </label>
                <select value={suffix} onChange={e => setSuffix(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none">
                  {Object.entries(SUFFIXES).map(([k,v]) => (
                    <option key={k} value={k}>{k ? k + ' — ' : ''}{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Code Émetteur (facultatif)
                  <span className="ml-1 text-gray-400 normal-case font-normal">ex: ART, FAB...</span>
                </label>
                <input type="text" value={emitter} onChange={e => setEmitter(e.target.value.toUpperCase().slice(0,4))}
                  maxLength={4} placeholder="ART"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none font-mono uppercase" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Code Unité (facultatif)
                  <span className="ml-1 text-gray-400 normal-case font-normal">ex: 000, 012, U01...</span>
                </label>
                <input type="text" value={unit} onChange={e => setUnit(e.target.value.toUpperCase().slice(0,4))}
                  maxLength={4} placeholder="000"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none font-mono uppercase" />
              </div>
            </div>
            {/* Preview numéro complet */}
            <div className="bg-[#003D5C]/5 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">Numéro de document généré <span className="font-bold text-[#009BA4]">(unique)</span></p>
              <p className="text-lg font-bold font-mono text-[#003D5C] break-all">{previewNum}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {previewNum.split('-').map((part, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 font-mono text-gray-600">{part}</span>
                ))}
              </div>
              {docs.find(d => d.doc_number === previewNum) && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Ce numéro existe déjà !
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">
                ← Retour
              </button>
              <button onClick={() => setStep(3)}
                className="flex-1 bg-[#009BA4] hover:bg-[#007A82] text-white font-semibold py-2.5 rounded-xl transition-colors">
                Suivant : Détails →
              </button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Désignation + Révision ── */}
        {step === 3 && (
          <div className="p-6">
            <h3 className="text-base font-bold text-[#003D5C] mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-[#009BA4]" /> Désignation & Révision initiale
            </h3>

            {/* Désignation */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Désignation du document <span className="text-red-500">*</span>
              </label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="ex: Schéma de boucle FT-001 — Mesure débit eau froide"
                className="w-full border-2 border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#009BA4] focus:outline-none" />
            </div>

            {/* Alerte doublons */}
            {similar.length > 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {similar.length} document(s) similaire(s) détecté(s) en discipline {discipline}
                </p>
                <div className="space-y-1">
                  {similar.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-amber-100">
                      <span className="font-mono text-[#003D5C] font-semibold">{s.doc_number}</span>
                      <span className="text-gray-600 mx-2 flex-1 truncate">{s.title}</span>
                      <span className="text-amber-600 font-bold">{s.score}% similaire</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-2">⚠️ Vérifiez qu'il ne s'agit pas du même document avant de créer.</p>
              </div>
            )}

            {/* Révision + Statut */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Révision initiale
                </label>
                <input type="text" value={revision} onChange={e => setRevision(e.target.value.slice(0,4))}
                  maxLength={4} placeholder="0"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none font-mono" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Statut initial <span className="text-red-500">*</span>
                </label>
                <select value={statut} onChange={e => setStatut(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none">
                  {Object.entries(STATUTS).map(([k,v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Auteur / Rédacteur <span className="text-red-500">*</span>
                </label>
                <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
                  placeholder="Prénom NOM"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Objet / Modifications
                </label>
                <input type="text" value={changes} onChange={e => setChanges(e.target.value)}
                  placeholder="Création initiale"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none" />
              </div>
            </div>

            {/* Récap */}
            <div className="bg-[#003D5C]/5 rounded-xl p-4 mb-6 text-xs space-y-1 font-mono">
              <div className="flex justify-between"><span className="text-gray-500">Numéro</span><span className="font-bold text-[#003D5C]">{previewNum}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Révision</span><span className="font-bold">{revision}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Statut</span><StatutBadge code={statut} /></div>
              <div className="flex justify-between"><span className="text-gray-500">Discipline</span><span>{discipline} — {DISCIPLINES[discipline]}</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">
                ← Retour
              </button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-[#003D5C] hover:bg-[#002A42] text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" />Création...</> : <><Plus className="w-4 h-4" />Créer le document</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VUE : REGISTRE DOCUMENTS
// ══════════════════════════════════════════════════════════════════════════════

function DocumentRegister({ docs, onAddRevision, notify }) {
  const [search, setSearch]           = useState('');
  const [filterDisc, setFilterDisc]   = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedId, setExpandedId]   = useState(null);
  const [revModal, setRevModal]       = useState(null); // doc object
  const [newRev, setNewRev]           = useState({ revision:'', status:'IFR', author:'', changes:'' });
  const [copiedId, setCopiedId]       = useState(null);

  const filtered = useMemo(() => docs.filter(d => {
    const matchSearch = !search || d.doc_number.toLowerCase().includes(search.toLowerCase())
      || d.title.toLowerCase().includes(search.toLowerCase());
    const matchDisc   = filterDisc === 'all' || d.discipline_code === filterDisc;
    const matchStatus = filterStatus === 'all' || d.current_status === filterStatus;
    return matchSearch && matchDisc && matchStatus;
  }), [docs, search, filterDisc, filterStatus]);

  const copyNum = (num, id) => {
    navigator.clipboard.writeText(num).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleAddRevision = async () => {
    if (!newRev.revision || !newRev.author) { notify('Révision et auteur obligatoires', 'error'); return; }
    const { error } = await onAddRevision(revModal.id, {
      ...newRev,
      revision_date: new Date().toISOString().split('T')[0],
    });
    if (error) { notify('❌ ' + error.message, 'error'); return; }
    notify(`✅ Révision ${newRev.revision} ajoutée`);
    setRevModal(null);
    setNewRev({ revision:'', status:'IFR', author:'', changes:'' });
  };

  return (
    <div>
      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher N° ou désignation..."
            className="w-full pl-9 border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none" />
        </div>
        <select value={filterDisc} onChange={e => setFilterDisc(e.target.value)}
          className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none">
          <option value="all">Toutes disciplines</option>
          {Object.entries(DISCIPLINES).map(([k,v]) => (
            <option key={k} value={k}>{k} — {v.slice(0,30)}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none">
          <option value="all">Tous statuts</option>
          {Object.entries(STATUTS).map(([k,v]) => <option key={k} value={k}>{k} — {v}</option>)}
        </select>
        <span className="text-xs text-gray-400 font-medium">{filtered.length} / {docs.length}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Aucun document</p>
          <p className="text-gray-400 text-sm">Créez votre premier document dans l'onglet "Nouveau"</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#003D5C] text-white">
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">N° Document</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Désignation</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Disc.</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Rév.</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider">Rév. hist.</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(doc => (
                  <React.Fragment key={doc.id}>
                    <tr className="hover:bg-blue-50/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[#003D5C] whitespace-nowrap">{doc.doc_number}</span>
                          <button onClick={() => copyNum(doc.doc_number, doc.id)}
                            className="text-gray-300 hover:text-[#009BA4] transition-colors">
                            <Copy className="w-3 h-3" />
                          </button>
                          {copiedId === doc.id && <span className="text-xs text-[#009BA4]">✓</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-[250px] truncate" title={doc.title}>{doc.title}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#003D5C]/10 text-[#003D5C]">{doc.discipline_code}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm font-bold text-gray-700">{doc.current_revision}</td>
                      <td className="px-4 py-3"><StatutBadge code={doc.current_status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#009BA4] transition-colors">
                          <History className="w-3 h-3" />
                          {doc.kore_revisions?.length || 0}
                          {expandedId === doc.id ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setRevModal(doc)}
                          className="text-xs px-3 py-1 rounded-lg bg-[#009BA4]/10 text-[#009BA4] hover:bg-[#009BA4] hover:text-white font-semibold transition-all">
                          + Révision
                        </button>
                      </td>
                    </tr>
                    {/* Historique des révisions */}
                    {expandedId === doc.id && doc.kore_revisions?.length > 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-3 bg-[#003D5C]/3">
                          <div className="rounded-xl border border-gray-100 overflow-hidden">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-50">
                                <tr>
                                  {['Révision','Statut','Date','Auteur','Objet modifications'].map(h => (
                                    <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-50">
                                {[...doc.kore_revisions].sort((a,b) => new Date(b.created_at) - new Date(a.created_at)).map(rev => (
                                  <tr key={rev.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-2 font-mono font-bold text-[#003D5C]">{rev.revision}</td>
                                    <td className="px-3 py-2"><StatutBadge code={rev.status} /></td>
                                    <td className="px-3 py-2 text-gray-500">{rev.revision_date}</td>
                                    <td className="px-3 py-2 text-gray-600">{rev.author}</td>
                                    <td className="px-3 py-2 text-gray-600">{rev.changes}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal ajout révision */}
      {revModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRevModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#003D5C]">Nouvelle révision</h3>
              <button onClick={() => setRevModal(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="text-xs font-mono text-[#009BA4] font-bold mb-4 bg-[#009BA4]/10 px-3 py-1.5 rounded-lg">
              {revModal.doc_number} — rév. actuelle : {revModal.current_revision}
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Révision *</label>
                  <input type="text" value={newRev.revision} onChange={e => setNewRev(p => ({...p, revision: e.target.value.slice(0,4)}))}
                    placeholder="1" maxLength={4}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none font-mono" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Statut *</label>
                  <select value={newRev.status} onChange={e => setNewRev(p => ({...p, status: e.target.value}))}
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none">
                    {Object.entries(STATUTS).map(([k,v]) => <option key={k} value={k}>{k} — {v}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Auteur *</label>
                <input type="text" value={newRev.author} onChange={e => setNewRev(p => ({...p, author: e.target.value}))}
                  placeholder="Prénom NOM"
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Objet des modifications</label>
                <textarea value={newRev.changes} onChange={e => setNewRev(p => ({...p, changes: e.target.value}))} rows={2}
                  placeholder="Description des modifications..."
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setRevModal(null)}
                className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">
                Annuler
              </button>
              <button onClick={handleAddRevision}
                className="flex-1 bg-[#003D5C] hover:bg-[#002A42] text-white font-semibold py-2.5 rounded-xl transition-colors">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// VUE : DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════

function DashboardView({ docs }) {
  const byDisc = useMemo(() => {
    const m = {};
    docs.forEach(d => { m[d.discipline_code] = (m[d.discipline_code] || 0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]).slice(0,8);
  }, [docs]);
  const byStatus = useMemo(() => {
    const m = {};
    docs.forEach(d => { m[d.current_status] = (m[d.current_status] || 0) + 1; });
    return Object.entries(m).sort((a,b) => b[1]-a[1]);
  }, [docs]);
  const maxCount = byDisc[0]?.[1] || 1;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Stats globales */}
      <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total documents', value: docs.length, color:'#003D5C' },
          { label:'Disciplines', value: new Set(docs.map(d=>d.discipline_code)).size, color:'#009BA4' },
          { label:'Affaires', value: new Set(docs.map(d=>d.project_number)).size, color:'#0091D5' },
          { label:'Émis IFC/ASB', value: docs.filter(d=>['IFC','ASB','FIN'].includes(d.current_status)).length, color:'#2ECC71' },
        ].map(({label,value,color}) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <p className="text-2xl font-bold" style={{color}}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
      {/* Par discipline */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h4 className="font-bold text-[#003D5C] mb-4 text-sm flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#009BA4]" /> Documents par discipline
        </h4>
        <div className="space-y-2">
          {byDisc.map(([code, count]) => (
            <div key={code} className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono w-8 text-[#003D5C]">{code}</span>
              <div className="flex-1 h-5 rounded bg-gray-100 overflow-hidden">
                <div className="h-full rounded transition-all duration-500"
                  style={{ width:`${(count/maxCount)*100}%`, background:'#009BA4' }} />
              </div>
              <span className="text-xs font-bold text-gray-600 w-4">{count}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Par statut */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h4 className="font-bold text-[#003D5C] mb-4 text-sm flex items-center gap-2">
          <Eye className="w-4 h-4 text-[#009BA4]" /> Répartition des statuts
        </h4>
        <div className="space-y-2">
          {byStatus.map(([code, count]) => (
            <div key={code} className="flex items-center justify-between">
              <StatutBadge code={code} />
              <span className="text-xs text-gray-500 ml-2 flex-1 truncate">{STATUTS[code]}</span>
              <span className="text-sm font-bold text-[#003D5C] w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// APP PRINCIPALE KORE
// ══════════════════════════════════════════════════════════════════════════════

export default function KoreApp() {
  const { user, profile, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const { docs, loading, insertDoc, insertRevision } = useKoreDocuments(user?.id);
  const [tab, setTab]     = useState('new');
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg, type = 'success') => setToast({ msg, type }), []);

  const handleCreateDoc = async (docData, revData) => {
    const { data, error } = await insertDoc(docData);
    if (error || !data) return { error };
    await insertRevision(data.id, revData);
    return { error: null };
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#003D5C] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#009BA4] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-[#8BBCC8] text-sm">Chargement...</p>
      </div>
    </div>
  );

  if (!user) return <AuthGate signIn={signIn} signUp={signUp} appName="KORE" />;

  const TABS = [
    { id:'new',    label:'Nouveau document', short:'Nouveau', icon: Plus },
    { id:'list',   label:'Registre',         short:'Registre', icon: FileText, count: docs.length },
    { id:'stats',  label:'Dashboard',        short:'Stats',  icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <KoreHeader user={user} profile={profile} signOut={signOut} docsCount={docs.length} />

      {/* Tabs */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            {TABS.map(({ id, label, short, icon: Icon, count }) => (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
                  tab === id
                    ? 'text-[#003D5C] border-[#009BA4] bg-[#009BA4]/5'
                    : 'text-gray-500 border-transparent hover:text-[#003D5C] hover:bg-gray-50'
                }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
                <span className="md:hidden">{short}</span>
                {count !== undefined && count > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-xs font-bold rounded-full bg-[#003D5C]/10 text-[#003D5C]">{count}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 text-[#009BA4] animate-spin" />
          </div>
        ) : (
          <>
            {tab === 'new'   && <NewDocumentForm docs={docs} onSubmit={handleCreateDoc} notify={notify} />}
            {tab === 'list'  && <DocumentRegister docs={docs} onAddRevision={insertRevision} notify={notify} />}
            {tab === 'stats' && <DashboardView docs={docs} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t border-gray-200 py-6">
        <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-400">KORE · Codification HXAQ023 Rév.10 · Artelia Group</p>
          <a href="#/" className="text-xs text-[#009BA4] hover:text-[#003D5C] font-medium transition-colors">← Retour au Hub Artelia</a>
        </div>
      </footer>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
