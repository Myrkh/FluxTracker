// ═══════════════════════════════════════════════════════════════════════════
// KORE — NewDocumentForm
// Wizard 3 étapes : N° Affaire → Codification → Détails
// v2.1 : + Vérificateur / Approbateur (optionnels) + Upload fichier R0 (optionnel)
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo, useRef } from 'react';
import { Plus, RefreshCw, FileText, History, Layers, AlertTriangle, Upload, Trash2 } from 'lucide-react';
import {
  CENTRES_PROFIT, ANNEES, CODES_DISTINCTIFS,
  DISCIPLINES, STATUTS, SUFFIXES,
} from '../../../constants';
import {
  buildDocNumber, buildProjectNumber, nextSequence,
  findSimilarDocuments, formatFileSize,
} from '../../../services';
import { StatutBadge } from '../../common/StatutBadge';

const ACCEPTED_TYPES = '.pdf,.docx,.doc,.xlsx,.xls,.dwg,.dxf,.pptx,.txt';
const MAX_SIZE_MB    = 50;

// ── Stepper ────────────────────────────────────────────────────────────────

function Stepper({ step, onGoTo }) {
  const steps = [['1', "N° Affaire"], ['2', 'Codification'], ['3', 'Détails']];
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map(([s, label], i) => (
        <React.Fragment key={s}>
          <button
            onClick={() => onGoTo(parseInt(s))}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              step === parseInt(s)
                ? 'bg-[#003D5C] text-white shadow'
                : step > parseInt(s)
                ? 'bg-[#009BA4]/10 text-[#009BA4] hover:bg-[#009BA4]/20'
                : 'bg-white text-gray-400 border border-gray-100'
            }`}
          >
            <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${
              step > parseInt(s)
                ? 'bg-[#009BA4] text-white'
                : step === parseInt(s)
                ? 'bg-white text-[#003D5C]'
                : 'bg-gray-200 text-gray-500'
            }`}>
              {step > parseInt(s) ? '✓' : s}
            </span>
            {label}
          </button>
          {i < 2 && (
            <div className={`flex-1 h-0.5 mx-1 ${step > i + 1 ? 'bg-[#009BA4]' : 'bg-gray-200'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────

export function NewDocumentForm({ docs, onSubmit, notify }) {
  const [step, setStep] = useState(1);

  // Étape 1 — N° affaire
  const [centre,     setCentre]     = useState('H');
  const [distinctif, setDistinctif] = useState('T');
  const [annee,      setAnnee]      = useState('L');
  const [ordre,      setOrdre]      = useState('001');

  // Étape 2 — Codification
  const [emitter,    setEmitter]    = useState('');
  const [unit,       setUnit]       = useState('');
  const [discipline, setDiscipline] = useState('INS');
  const [suffix,     setSuffix]     = useState('');

  // Étape 3 — Détails
  const [title,        setTitle]        = useState('');
  const [revision,     setRevision]     = useState('0');
  const [statut,       setStatut]       = useState('PRE');
  const [author,       setAuthor]       = useState('');       // rédacteur
  const [verificateur, setVerificateur] = useState('');       // optionnel
  const [approbateur,  setApprobateur]  = useState('');       // optionnel
  const [changes,      setChanges]      = useState('Création initiale');
  const [file,         setFile]         = useState(null);     // upload optionnel
  const [dragOver,     setDragOver]     = useState(false);
  const [loading,      setLoading]      = useState(false);

  const fileRef = useRef(null);

  const projectNum = useMemo(
    () => buildProjectNumber(centre, distinctif, annee, ordre),
    [centre, distinctif, annee, ordre]
  );

  const sequence = useMemo(
    () => nextSequence(docs, projectNum, discipline),
    [docs, projectNum, discipline]
  );

  const previewNum = useMemo(
    () => buildDocNumber(projectNum, emitter, unit, discipline, parseInt(sequence) || 1, suffix),
    [projectNum, emitter, unit, discipline, sequence, suffix]
  );

  const similar = useMemo(
    () => findSimilarDocuments(title, docs, discipline),
    [title, docs, discipline]
  );

  const isDuplicate = docs.some(d => d.doc_number === previewNum);

  // ── Gestion fichier ────────────────────────────────────────────────────
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

  // ── Soumission ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!title.trim())  { notify('La désignation est obligatoire', 'error'); return; }
    if (!author.trim()) { notify('Le rédacteur est obligatoire', 'error'); return; }
    if (isDuplicate)    { notify(`❌ Le N° ${previewNum} existe déjà`, 'error'); return; }

    setLoading(true);
    const { error } = await onSubmit(
      {
        doc_number:       previewNum,
        project_number:   projectNum,
        emitter_code:     emitter    || null,
        unit_code:        unit       || null,
        discipline_code:  discipline,
        discipline_label: DISCIPLINES[discipline],
        suffix_code:      suffix     || null,
        sequence_number:  parseInt(sequence) || 1,
        title:            title.trim(),
        current_revision: revision,
        current_status:   statut,
      },
      {
        revision,
        status:        statut,
        author:        author.trim(),
        redacteur:     author.trim(),
        verificateur:  verificateur.trim() || null,
        approbateur:   approbateur.trim()  || null,
        changes:       changes.trim() || 'Création initiale',
        revision_date: new Date().toISOString().split('T')[0],
      },
      file   // ← null si pas de fichier (workflow normal)
    );
    setLoading(false);

    if (error) { notify('❌ Erreur création : ' + error.message, 'error'); return; }

    const msg = file
      ? `✅ Document ${previewNum} créé avec fichier joint`
      : `✅ Document ${previewNum} créé`;
    notify(msg);

    // Reset
    setTitle(''); setAuthor(''); setVerificateur(''); setApprobateur('');
    setChanges('Création initiale'); setFile(null); setStep(1);
  };

  const inputCls = 'w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-[#009BA4] focus:outline-none';
  const monoCls  = `${inputCls} font-mono uppercase`;

  return (
    <div className="max-w-3xl mx-auto">
      <Stepper step={step} onGoTo={setStep} />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        {/* ── ÉTAPE 1 : N° d'affaire ─────────────────────────────────────── */}
        {step === 1 && (
          <div className="p-6">
            <h3 className="text-base font-bold text-[#003D5C] mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#009BA4]" /> N° d'affaire (HXAQ023 §2.1)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Centre de profit *</label>
                <select value={centre} onChange={e => setCentre(e.target.value)} className={inputCls}>
                  {Object.entries(CENTRES_PROFIT).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Code distinctif *</label>
                <select value={distinctif} onChange={e => setDistinctif(e.target.value)} className={inputCls}>
                  {CODES_DISTINCTIFS.map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Année *</label>
                <select value={annee} onChange={e => setAnnee(e.target.value)} className={inputCls}>
                  {Object.entries(ANNEES).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">N° ordre *</label>
                <input
                  type="text" value={ordre}
                  onChange={e => setOrdre(e.target.value.replace(/\D/g, '').padStart(3, '0').slice(-3))}
                  maxLength={3} placeholder="001"
                  className={`${inputCls} font-mono`}
                />
              </div>
            </div>

            <div className="bg-[#003D5C]/5 rounded-xl p-4 mb-6 flex items-center gap-3">
              <FileText className="w-5 h-5 text-[#009BA4] flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 mb-0.5">N° d'affaire généré</p>
                <p className="text-xl font-bold font-mono text-[#003D5C]">{projectNum}</p>
              </div>
            </div>

            <button onClick={() => setStep(2)} className="w-full bg-[#009BA4] hover:bg-[#007A82] text-white font-semibold py-2.5 rounded-xl transition-colors">
              Suivant : Codification →
            </button>
          </div>
        )}

        {/* ── ÉTAPE 2 : Codification ─────────────────────────────────────── */}
        {step === 2 && (
          <div className="p-6">
            <h3 className="text-base font-bold text-[#003D5C] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#009BA4]" /> Codification du document (§2.2)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Discipline <span className="text-red-500">*</span>
                </label>
                <select value={discipline} onChange={e => setDiscipline(e.target.value)} className={inputCls}>
                  {Object.entries(DISCIPLINES).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Suffixe (facultatif)</label>
                <select value={suffix} onChange={e => setSuffix(e.target.value)} className={inputCls}>
                  {Object.entries(SUFFIXES).map(([k, v]) => (
                    <option key={k} value={k}>{k ? `${k} — ` : ''}{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Code Émetteur <span className="text-gray-400 normal-case font-normal">(facultatif, ex: ART)</span>
                </label>
                <input type="text" value={emitter} onChange={e => setEmitter(e.target.value.toUpperCase().slice(0, 4))}
                  maxLength={4} placeholder="ART" className={monoCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Code Unité <span className="text-gray-400 normal-case font-normal">(facultatif, ex: 012)</span>
                </label>
                <input type="text" value={unit} onChange={e => setUnit(e.target.value.toUpperCase().slice(0, 4))}
                  maxLength={4} placeholder="000" className={monoCls} />
              </div>
            </div>

            <div className="bg-[#003D5C]/5 rounded-xl p-4 mb-6">
              <p className="text-xs text-gray-500 mb-1">
                Numéro de document généré <span className="font-bold text-[#009BA4]">(unique)</span>
              </p>
              <p className="text-lg font-bold font-mono text-[#003D5C] break-all">{previewNum}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {previewNum.split('-').map((part, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded bg-white border border-gray-200 font-mono text-gray-600">{part}</span>
                ))}
              </div>
              {isDuplicate && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Ce numéro existe déjà !
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">← Retour</button>
              <button onClick={() => setStep(3)} className="flex-1 bg-[#009BA4] hover:bg-[#007A82] text-white font-semibold py-2.5 rounded-xl transition-colors">Suivant : Détails →</button>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Détails ──────────────────────────────────────────── */}
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
              <input
                type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="ex: Schéma de boucle FT-001 — Mesure débit eau froide"
                className={inputCls}
              />
            </div>

            {/* Alerte doublons */}
            {similar.length > 0 && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {similar.length} document(s) similaire(s) en {discipline}
                </p>
                <div className="space-y-1">
                  {similar.map(s => (
                    <div key={s.id} className="flex items-center justify-between text-xs bg-white rounded-lg px-3 py-1.5 border border-amber-100">
                      <span className="font-mono text-[#003D5C] font-semibold shrink-0">{s.doc_number}</span>
                      <span className="text-gray-600 mx-2 flex-1 truncate">{s.title}</span>
                      <span className="text-amber-600 font-bold shrink-0">{s.score}% similaire</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-amber-600 mt-2">⚠️ Vérifiez qu'il ne s'agit pas du même document avant de créer.</p>
              </div>
            )}

            {/* Révision + Statut */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Révision initiale</label>
                <input type="text" value={revision} onChange={e => setRevision(e.target.value.slice(0, 4))}
                  maxLength={4} placeholder="0" className={`${inputCls} font-mono`} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Statut initial <span className="text-red-500">*</span>
                </label>
                <select value={statut} onChange={e => setStatut(e.target.value)} className={inputCls}>
                  {Object.entries(STATUTS).map(([k, v]) => (
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Rédacteur + Objet */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Rédacteur <span className="text-red-500">*</span>
                </label>
                <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
                  placeholder="Prénom NOM" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">Objet / Modifications</label>
                <input type="text" value={changes} onChange={e => setChanges(e.target.value)}
                  placeholder="Création initiale" className={inputCls} />
              </div>
            </div>

            {/* Vérificateur + Approbateur */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Vérificateur
                  <span className="text-gray-400 normal-case font-normal ml-1">(optionnel)</span>
                </label>
                <input type="text" value={verificateur} onChange={e => setVerificateur(e.target.value)}
                  placeholder="Prénom NOM" className={inputCls} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                  Approbateur
                  <span className="text-gray-400 normal-case font-normal ml-1">(optionnel)</span>
                </label>
                <input type="text" value={approbateur} onChange={e => setApprobateur(e.target.value)}
                  placeholder="Prénom NOM" className={inputCls} />
              </div>
            </div>

            {/* ── Zone upload fichier R0 (optionnelle) ─────────────────── */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
                Fichier R0
                <span className="text-gray-400 normal-case font-normal ml-1">
                  — optionnel · le document est souvent créé AVANT le fichier
                </span>
              </label>

              {!file ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all
                    ${dragOver
                      ? 'border-[#009BA4] bg-[#009BA4]/5'
                      : 'border-gray-200 hover:border-[#009BA4]/40 hover:bg-gray-50'
                    }
                  `}
                >
                  <Upload className="w-5 h-5 text-gray-300 mx-auto mb-1.5" />
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-[#009BA4]">Cliquez</span> ou glissez un fichier
                    <span className="text-gray-400 ml-1">(PDF, DOCX, DWG… max 50 MB)</span>
                  </p>
                  <input
                    ref={fileRef} type="file" accept={ACCEPTED_TYPES}
                    className="hidden"
                    onChange={e => handleFile(e.target.files[0])}
                  />
                </div>
              ) : (
                <div className="border-2 border-[#009BA4]/30 bg-[#009BA4]/5 rounded-xl p-3 flex items-center gap-3">
                  <FileText className="w-7 h-7 text-[#009BA4] flex-shrink-0" />
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

            {/* Récap */}
            <div className="bg-[#003D5C]/5 rounded-xl p-4 mb-6 text-xs space-y-1.5 font-mono">
              <div className="flex justify-between"><span className="text-gray-500">Numéro</span><span className="font-bold text-[#003D5C]">{previewNum}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Révision</span><span className="font-bold">{revision}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Statut</span><StatutBadge code={statut} /></div>
              <div className="flex justify-between"><span className="text-gray-500">Discipline</span><span>{discipline} — {DISCIPLINES[discipline]}</span></div>
              {(verificateur || approbateur) && (
                <div className="pt-1 border-t border-[#003D5C]/10 space-y-1">
                  {verificateur && <div className="flex justify-between"><span className="text-gray-500">Vérificateur</span><span>{verificateur}</span></div>}
                  {approbateur  && <div className="flex justify-between"><span className="text-gray-500">Approbateur</span><span>{approbateur}</span></div>}
                </div>
              )}
              {file && (
                <div className="pt-1 border-t border-[#003D5C]/10 flex justify-between">
                  <span className="text-gray-500">Fichier</span>
                  <span className="text-[#009BA4]">✓ {file.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border-2 border-gray-200 text-gray-600 font-semibold py-2.5 rounded-xl hover:border-gray-300 transition-colors">← Retour</button>
              <button onClick={handleSubmit} disabled={loading}
                className="flex-1 bg-[#003D5C] hover:bg-[#002A42] text-white font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {loading
                  ? <><RefreshCw className="w-4 h-4 animate-spin" />Création...</>
                  : <><Plus className="w-4 h-4" />Créer le document</>
                }
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}