// ═══════════════════════════════════════════════════════════════════════════
// KORE — ImportView
// Import Excel avec mapping visuel des colonnes
// Pattern identique à OmniLink ImportView, adapté aux champs KORE
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, ArrowRight, CheckCircle2,
         AlertCircle, X, RefreshCw, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';

// ── Champs KORE cibles ───────────────────────────────────────────────────
const KORE_FIELDS = [
  { key: 'doc_number',        label: 'N° Document',   required: true,  hint: 'ex: HTL001-INS-0001-LPD' },
  { key: 'title',             label: 'Désignation',   required: true,  hint: 'Titre du document' },
  { key: 'discipline_code',   label: 'Discipline',    required: false, hint: 'ex: INS, ELE, PRO' },
  { key: 'project_number',    label: 'N° Affaire',    required: false, hint: 'ex: HTL001' },
  { key: 'current_revision',  label: 'Révision',      required: false, hint: 'ex: 0, 1, A, B' },
  { key: 'current_status',    label: 'Statut',        required: false, hint: 'ex: PRE, IFR, IFC' },
  { key: 'redacteur',         label: 'Rédacteur',     required: false, hint: 'Nom complet' },
  { key: 'verificateur',      label: 'Vérificateur',  required: false, hint: 'Nom complet' },
  { key: 'approbateur',       label: 'Approbateur',   required: false, hint: 'Nom complet' },
];

// Auto-détection colonne → champ KORE
const AUTO_DETECT_PATTERNS = {
  doc_number:       ['numero', 'number', 'n°', 'doc_number', 'ref', 'reference', 'code'],
  title:            ['titre', 'title', 'designation', 'libelle', 'description', 'objet'],
  discipline_code:  ['discipline', 'disc', 'metier'],
  project_number:   ['affaire', 'projet', 'project', 'num_affaire', 'n_affaire'],
  current_revision: ['revision', 'rev', 'indice', 'index'],
  current_status:   ['statut', 'status', 'etat', 'état', 'phase'],
  redacteur:        ['redacteur', 'auteur', 'author', 'etabli', 'etabli_par'],
  verificateur:     ['verificateur', 'verifie', 'checker', 'verifie_par'],
  approbateur:      ['approbateur', 'approuve', 'approver', 'vise'],
};

function detectField(colName) {
  const normalized = colName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const [field, patterns] of Object.entries(AUTO_DETECT_PATTERNS)) {
    if (patterns.some(p => normalized.includes(p.replace(/[^a-z0-9]/g, '')))) {
      return field;
    }
  }
  return null;
}

// ── Étape 1 : Upload fichier ─────────────────────────────────────────────
function StepUpload({ onFileLoaded }) {
  const [dragging, setDragging] = useState(false);

  const processFile = (file) => {
    if (!file || !file.name.endsWith('.xlsx')) {
      alert('Veuillez sélectionner un fichier .xlsx');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb   = XLSX.read(e.target.result, { type: 'array' });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (rows.length < 2) { alert('Le fichier est vide ou ne contient pas de données'); return; }
      const headers = rows[0].map(h => String(h).trim());
      const data    = rows.slice(1).filter(r => r.some(c => c !== ''));
      onFileLoaded({ fileName: file.name, headers, data });
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div
      className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
        ${dragging ? 'border-[#009BA4] bg-teal-50' : 'border-gray-200 hover:border-[#009BA4] hover:bg-gray-50'}`}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={e => { e.preventDefault(); setDragging(false); processFile(e.dataTransfer.files[0]); }}
      onClick={() => document.getElementById('kore-import-input').click()}
    >
      <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-600 font-semibold text-lg mb-1">Déposer un fichier Excel</p>
      <p className="text-gray-400 text-sm mb-4">ou cliquer pour sélectionner un fichier .xlsx</p>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#003D5C] text-white text-sm font-semibold rounded-xl">
        <Upload className="w-4 h-4" />
        Choisir un fichier
      </div>
      <input
        id="kore-import-input"
        type="file"
        accept=".xlsx"
        className="hidden"
        onChange={e => processFile(e.target.files[0])}
      />
      <p className="text-xs text-gray-400 mt-4">
        La première ligne doit contenir les en-têtes de colonnes.
        La détection automatique est activée pour les colonnes standards KORE.
      </p>
    </div>
  );
}

// ── Étape 2 : Mapping colonnes ───────────────────────────────────────────
function StepMapping({ fileName, headers, data, mapping, onMappingChange, onNext, onBack }) {
  const preview = data.slice(0, 3);

  const getColumnPreview = (colIdx) =>
    preview.map(row => row[colIdx] || '').filter(Boolean).join(' · ').slice(0, 60) || '—';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-[#003D5C]">{fileName}</p>
          <p className="text-sm text-gray-500">{data.length} lignes · {headers.length} colonnes détectées</p>
        </div>
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-[#003D5C] transition-colors">
          ← Autre fichier
        </button>
      </div>

      {/* Grille mapping */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-2 bg-[#003D5C] text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5">
          <span>Colonne dans votre fichier</span>
          <span>Champ KORE correspondant</span>
        </div>
        <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto">
          {headers.map((col, idx) => (
            <div key={idx} className="grid grid-cols-2 gap-4 px-4 py-2.5 items-center hover:bg-gray-50/50">
              <div>
                <p className="text-sm font-semibold text-gray-700">{col}</p>
                <p className="text-xs text-gray-400 truncate">{getColumnPreview(idx)}</p>
              </div>
              <select
                value={mapping[idx] || ''}
                onChange={e => onMappingChange(idx, e.target.value)}
                className="w-full px-3 py-1.5 rounded-xl border border-gray-200 text-sm focus:border-[#009BA4] focus:outline-none bg-white"
              >
                <option value="">— Ignorer cette colonne —</option>
                {KORE_FIELDS.map(f => (
                  <option key={f.key} value={f.key}>
                    {f.label}{f.required ? ' *' : ''}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Validation champs requis */}
      {(() => {
        const mapped = Object.values(mapping);
        const missing = KORE_FIELDS.filter(f => f.required && !mapped.includes(f.key));
        return missing.length > 0 ? (
          <div className="flex items-center gap-2 text-amber-600 bg-amber-50 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            Champs obligatoires non mappés : {missing.map(f => f.label).join(', ')}
          </div>
        ) : null;
      })()}

      <div className="flex justify-end">
        <button
          onClick={onNext}
          disabled={!Object.values(mapping).includes('doc_number') || !Object.values(mapping).includes('title')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#003D5C] text-white text-sm font-semibold rounded-xl hover:bg-[#002A42] transition-all disabled:opacity-50"
        >
          Prévisualiser l'import
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Étape 3 : Preview & import ───────────────────────────────────────────
function StepPreview({ rows, onImport, onBack, loading, result }) {
  if (result) {
    return (
      <div className="text-center py-10">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
        <p className="text-xl font-bold text-[#003D5C] mb-2">Import terminé</p>
        <div className="flex justify-center gap-6 text-sm mt-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{result.inserted}</p>
            <p className="text-gray-500">Insérés</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{result.skipped}</p>
            <p className="text-gray-500">Ignorés (doublons)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{result.errors}</p>
            <p className="text-gray-500">Erreurs</p>
          </div>
        </div>
        {result.errorDetails?.length > 0 && (
          <div className="mt-4 text-left bg-red-50 rounded-xl p-4 max-h-40 overflow-y-auto">
            {result.errorDetails.map((e, i) => (
              <p key={i} className="text-xs text-red-600">• {e}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[#003D5C]">
          {rows.length} document{rows.length > 1 ? 's' : ''} à importer
        </p>
        <button onClick={onBack} className="text-sm text-gray-400 hover:text-[#003D5C]">
          ← Modifier le mapping
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-xs">
            <thead className="bg-[#003D5C] text-white sticky top-0">
              <tr>
                {['N° Document', 'Désignation', 'Discipline', 'Révision', 'Statut'].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                  <td className="px-3 py-2 font-mono font-bold text-[#003D5C]">{row.doc_number}</td>
                  <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">{row.title}</td>
                  <td className="px-3 py-2 text-gray-500">{row.discipline_code || '—'}</td>
                  <td className="px-3 py-2 font-mono text-gray-500">{row.current_revision || '0'}</td>
                  <td className="px-3 py-2">
                    {row.current_status
                      ? <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-xs font-bold">{row.current_status}</span>
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={onImport}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#003D5C] text-white text-sm font-semibold rounded-xl hover:bg-[#002A42] transition-all disabled:opacity-50"
        >
          {loading
            ? <><RefreshCw className="w-4 h-4 animate-spin" /> Import en cours...</>
            : <><Download className="w-4 h-4" /> Importer {rows.length} documents</>
          }
        </button>
      </div>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────
export function ImportView({ activeProject, userId, notify, onImportDone }) {
  const [step,    setStep]    = useState('upload');   // upload | mapping | preview
  const [file,    setFile]    = useState(null);
  const [mapping, setMapping] = useState({});
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);

  const handleFileLoaded = ({ fileName, headers, data }) => {
    // Auto-détection du mapping
    const autoMapping = {};
    headers.forEach((col, idx) => {
      const detected = detectField(col);
      if (detected) autoMapping[idx] = detected;
    });
    setFile({ fileName, headers, data });
    setMapping(autoMapping);
    setStep('mapping');
  };

  const handleMappingChange = useCallback((colIdx, fieldKey) => {
    setMapping(prev => {
      const next = { ...prev };
      // Dé-mapper si ce champ était déjà assigné ailleurs
      Object.keys(next).forEach(k => { if (next[k] === fieldKey && Number(k) !== colIdx) delete next[k]; });
      if (fieldKey) next[colIdx] = fieldKey;
      else delete next[colIdx];
      return next;
    });
  }, []);

  const handleBuildPreview = () => {
    const built = file.data.map(row => {
      const doc = {};
      Object.entries(mapping).forEach(([colIdx, fieldKey]) => {
        const val = String(row[colIdx] || '').trim();
        if (val) doc[fieldKey] = val;
      });
      return doc;
    }).filter(d => d.doc_number && d.title);

    setRows(built);
    setStep('preview');
  };

  const handleImport = async () => {
  if (!activeProject) { notify?.('Sélectionnez un projet', 'error'); return; }
  setLoading(true);
  let inserted = 0, skipped = 0, errors = 0;
  const errorDetails = [];

  for (const row of rows) {
    try {
      // 1. On sépare les données : ce qui va dans DOCS et ce qui va dans REVISIONS
      const { redacteur, verificateur, approbateur, ...docData } = row;

      // 2. Insertion dans kore_documents
      const { data: newDoc, error: docError } = await supabase
        .from('kore_documents')
        .insert({
          ...docData,
          current_revision: row.current_revision || '0',
          current_status:   row.current_status   || 'PRE',
          project_id:       activeProject.id,
          user_id:          userId,
        })
        .select()
        .single();

      if (docError) {
        if (docError.code === '23505') { skipped++; continue; }
        throw docError;
      }

      // 3. Insertion automatique de la révision correspondante
      const { error: revError } = await supabase
        .from('kore_revisions')
        .insert({
          document_id: newDoc.id,
          revision:    row.current_revision || '0',
          status:      row.current_status   || 'PRE',
          redacteur:   redacteur || null,      // Voilà tes colonnes !
          verificateur: verificateur || null,
          approbateur: approbateur || null
        });

      if (revError) {
        // Optionnel : supprimer le doc si la révision échoue pour rester cohérent
        errorDetails.push(`${row.doc_number}: Erreur révision (${revError.message})`);
      }

      inserted++;
    } catch (err) {
      errors++;
      errorDetails.push(`${row.doc_number}: ${err.message}`);
    }
  }

    setLoading(false);
    setResult({ inserted, skipped, errors, errorDetails });
    if (inserted > 0) {
      notify?.(`${inserted} document${inserted > 1 ? 's' : ''} importé${inserted > 1 ? 's' : ''} avec succès`);
      onImportDone?.();
    }
  };

  const reset = () => {
    setStep('upload'); setFile(null); setMapping({});
    setRows([]); setResult(null);
  };

  // Étapes visuelles
  const steps = [
    { id: 'upload',   label: 'Fichier',   done: step !== 'upload'  },
    { id: 'mapping',  label: 'Mapping',   done: step === 'preview' || !!result },
    { id: 'preview',  label: 'Import',    done: !!result           },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#003D5C] flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#009BA4]" />
            Import de documents
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Importez une base documentaire existante depuis Excel
          </p>
        </div>
        {result && (
          <button onClick={reset} className="flex items-center gap-2 text-sm text-[#009BA4] hover:text-[#003D5C] font-semibold transition-colors">
            <RefreshCw className="w-4 h-4" /> Nouvel import
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className={`flex items-center gap-2 text-sm font-semibold transition-colors
              ${step === s.id ? 'text-[#003D5C]' : s.done ? 'text-[#009BA4]' : 'text-gray-300'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                ${step === s.id ? 'bg-[#003D5C] text-white' : s.done ? 'bg-[#009BA4] text-white' : 'bg-gray-100 text-gray-400'}`}>
                {s.done ? '✓' : i + 1}
              </div>
              {s.label}
            </div>
            {i < steps.length - 1 && <div className={`flex-1 h-px ${s.done ? 'bg-[#009BA4]' : 'bg-gray-100'}`} />}
          </React.Fragment>
        ))}
      </div>

      {/* Contenu par étape */}
      <div className="bg-gray-50 rounded-2xl p-5">
        {step === 'upload' && <StepUpload onFileLoaded={handleFileLoaded} />}
        {step === 'mapping' && file && (
          <StepMapping
            fileName={file.fileName}
            headers={file.headers}
            data={file.data}
            mapping={mapping}
            onMappingChange={handleMappingChange}
            onNext={handleBuildPreview}
            onBack={reset}
          />
        )}
        {(step === 'preview' || result) && (
          <StepPreview
            rows={rows}
            onImport={handleImport}
            onBack={() => setStep('mapping')}
            loading={loading}
            result={result}
          />
        )}
      </div>
    </div>
  );
}
