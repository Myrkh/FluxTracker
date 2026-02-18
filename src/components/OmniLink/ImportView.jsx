import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, Activity } from 'lucide-react';
import ExcelJS from 'exceljs';

/**
 * ImportView - Composant d'import Excel pour OmniLink
 * 
 * Workflow en 5 étapes :
 * 1. Upload fichier .xlsx/.xls
 * 2. Mapping des colonnes Excel vers champs BDD (auto-détection)
 * 3. Preview des données à importer
 * 4. Import en cours avec progression
 * 5. Résultats de l'import
 * 
 * @param {Object} props
 * @param {Function} props.onBulkInsert - Fonction d'import en masse (records, onProgress) => { inserted, skipped, errors }
 * @param {Function} props.onNotify - Fonction de notification (message, type)
 */
export default function ImportView({ onBulkInsert, onNotify }) {
  const [step, setStep] = useState(1);
  const [excelData, setExcelData] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [importData, setImportData] = useState([]);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, inserted: 0, skipped: 0, errors: 0 });
  const [importResults, setImportResults] = useState(null);
  const [duplicateStrategy, setDuplicateStrategy] = useState('skip');

  // Mapping des colonnes possibles (patterns de reconnaissance)
  const COLUMN_MAPPINGS = {
    tag: ['tag', 'repere', 'repère', 'instrument', 'point'],
    service: ['service', 'designation', 'désignation', 'description'],
    function: ['function', 'fonction', 'type'],
    sub_function: ['sub_function', 'sous_fonction', 'subfunction'],
    loc: ['loc', 'location', 'localisation', 'zone'],
    loop_type: ['loop_type', 'type_boucle', 'looptype', 'boucle'],
    system: ['system', 'système', 'systeme'],
    sig: ['sig', 'signal', 'type_signal'],
    alim: ['alim', 'alimentation'],
    isolator: ['isolator', 'isolateur', 'isolat'],
    lightning: ['lightning', 'parafoudre'],
    io_card_type: ['io_card_type', 'carte', 'card'],
    io_address: ['io_address', 'adresse', 'address', 'io'],
    net_type: ['net_type', 'reseau', 'réseau', 'network'],
    system_cabinet: ['system_cabinet', 'armoire', 'cabinet'],
    jb_tag: ['jb_tag', 'jb', 'boite', 'boîte', 'junction_box'],
    jb_dwg: ['jb_dwg', 'plan_jb', 'jb_plan'],
    obs: ['obs', 'observation', 'commentaire', 'comment', 'remarks', 'note'],
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await uploadedFile.arrayBuffer();
      await workbook.xlsx.load(buffer);
      
      console.log('📊 Fichier Excel chargé');
      console.log('Nombre de sheets:', workbook.worksheets.length);
      workbook.worksheets.forEach((ws, idx) => console.log(`  Sheet ${idx}: "${ws.name}"`));
      
      const worksheet = workbook.worksheets[0];
      console.log('📋 Lecture de la sheet:', worksheet.name);
      console.log('Nombre de lignes:', worksheet.actualRowCount);
      console.log('Nombre de colonnes:', worksheet.actualColumnCount);
      
      const headers = [];
      const rows = [];

      worksheet.eachRow((row, rowNumber) => {
        console.log(`\n📍 Ligne ${rowNumber}: ${row.values?.length || 0} cells`);
        if (rowNumber === 1) {
          console.log('  Contenu brut de la ligne 1 (maître-entête):', row.values);
          row.eachCell((cell, colNumber) => {
            const cellValue = cell.value?.toString() || '';
            console.log(`    Cell [${colNumber}]: "${cellValue}" (type: ${typeof cell.value})`);
            headers.push(cellValue);
          });
        } else {
          const rowData = {};
          row.eachCell((cell, colNumber) => {
            rowData[headers[colNumber - 1]] = cell.value;
          });
          rows.push(rowData);
        }
      });
      
      console.log('\n✅ Extraction complète:');
      console.log('Headers finaux:', headers);
      console.log('Nombre de lignes de données:', rows.length);

      setExcelData({ headers, rows });
      
      // Auto-detect mapping
      const autoMapping = {};
      
      // DEBUG: Afficher tous les en-têtes
      console.log('=== DÉTECTION DES COLONNES ===');
      console.log('En-têtes bruts trouvés:', headers);
      
      headers.forEach(header => {
        const normalizedHeader = header.toLowerCase().trim();
        console.log(`\nColonne: "${header}" → Normalisée: "${normalizedHeader}"`);
        
        for (const [field, patterns] of Object.entries(COLUMN_MAPPINGS)) {
          const matches = patterns.filter(p => normalizedHeader.includes(p));
          if (matches.length > 0) {
            console.log(`  ✅ MATCH trouvé pour "${field}" avec pattern(s): ${matches.join(', ')}`);
            autoMapping[field] = header;
            break;
          } else {
            console.log(`  ❌ Pas de match pour "${field}" (patterns: ${patterns.join(', ')})`);
          }
        }
      });
      
      console.log('\n=== RÉSULTAT DU MAPPING ===');
      console.log('Mapping automatique:', autoMapping);
      console.log('Colonnes détectées:', Object.keys(autoMapping).length);
      
      setColumnMapping(autoMapping);
      setStep(2);
      onNotify(`Fichier chargé — ${rows.length} lignes détectées`, 'success');
    } catch (err) {
      onNotify('Erreur de lecture du fichier : ' + err.message, 'error');
    }
  };

  const handleMappingChange = (field, excelColumn) => {
    setColumnMapping(prev => ({ ...prev, [field]: excelColumn }));
  };

  const generateImportData = () => {
    const mapped = excelData.rows.map((row) => {
      const record = {};
      Object.entries(columnMapping).forEach(([field, excelCol]) => {
        if (excelCol && row[excelCol] !== undefined && row[excelCol] !== null && row[excelCol] !== '') {
          record[field] = row[excelCol].toString().trim();
        }
      });
      
      if (!record.tag) return null; // Skip si pas de TAG
      return record;
    }).filter(Boolean);

    setImportData(mapped);
    setStep(3);
  };

  const startImport = async () => {
    setStep(4);
    setImportProgress({ current: 0, total: importData.length, inserted: 0, skipped: 0, errors: 0 });

    const onProgress = (current, total, inserted, skipped, errors) => {
      setImportProgress({ current, total, inserted, skipped, errors });
    };

    const results = await onBulkInsert(importData, onProgress);
    setImportResults(results);
    setStep(5);
  };

  const reset = () => {
    setStep(1);
    setExcelData(null);
    setColumnMapping({});
    setImportData([]);
    setImportProgress({ current: 0, total: 0, inserted: 0, skipped: 0, errors: 0 });
    setImportResults(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg"><Upload className="w-6 h-6" /></div>
          <span>Import Excel</span>
        </h2>
        <p className="text-[#00B4D8]/80 mt-1 text-sm">Importer une base instrumentiste existante</p>
      </div>

      <div className="p-8">
        {/* Progress stepper */}
        <div className="flex items-center justify-center mb-8 space-x-2">
          {[
            { num: 1, label: 'Fichier' },
            { num: 2, label: 'Mapping' },
            { num: 3, label: 'Preview' },
            { num: 4, label: 'Import' },
            { num: 5, label: 'Résultats' }
          ].map(({ num, label }) => (
            <React.Fragment key={num}>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm transition-all ${
                step === num ? 'bg-[#00375A] text-white ring-4 ring-[#00375A]/20' :
                step > num ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
              </div>
              <span className={`text-xs font-medium ${step >= num ? 'text-[#00375A]' : 'text-gray-400'}`}>{label}</span>
              {num < 5 && <div className={`w-8 h-0.5 ${step > num ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="max-w-xl mx-auto">
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:border-[#0091D5] transition-colors">
              <Upload className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Sélectionner un fichier Excel</h3>
              <p className="text-sm text-gray-500 mb-4">Formats supportés : .xlsx, .xls</p>
              <label className="inline-block px-6 py-3 bg-[#00375A] text-white rounded-lg font-medium cursor-pointer hover:bg-[#004A73] transition-colors">
                Choisir un fichier
                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-[#00375A] mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Format attendu
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Première ligne = en-têtes de colonnes</li>
                <li>• Colonne TAG obligatoire</li>
                <li>• Les autres colonnes seront mappées automatiquement</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Mapping */}
        {step === 2 && excelData && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Associer les colonnes Excel aux champs de la base</h3>
            <p className="text-sm text-gray-500 mb-6">Les colonnes détectées automatiquement sont pré-sélectionnées. Ajustez si nécessaire.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {Object.keys(COLUMN_MAPPINGS).map(field => (
                <div key={field} className="flex items-center space-x-3">
                  <label className="w-32 text-sm font-medium text-gray-700 capitalize">{field.replace(/_/g, ' ')}</label>
                  <select
                    value={columnMapping[field] || ''}
                    onChange={(e) => handleMappingChange(field, e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus:border-[#00375A] focus:ring-2 focus:ring-[#00375A]/20">
                    <option value="">-- Ignorer --</option>
                    {excelData.headers.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex space-x-4">
              <button onClick={() => setStep(1)} className="px-6 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Retour
              </button>
              <button onClick={generateImportData} className="px-6 py-2 bg-[#00375A] text-white rounded-lg font-medium hover:bg-[#004A73] transition-colors">
                Suivant : Preview
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Preview */}
        {step === 3 && importData.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview des données à importer</h3>
            <p className="text-sm text-gray-500 mb-6">{importData.length} enregistrements valides détectés (TAG non vide)</p>
            
            <div className="overflow-x-auto rounded-lg border-2 border-gray-200 mb-6 max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    {Object.keys(columnMapping).filter(k => columnMapping[k]).slice(0, 8).map(field => (
                      <th key={field} className="px-3 py-2 text-left text-xs font-semibold text-gray-600 uppercase">
                        {field}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {importData.slice(0, 10).map((row, i) => (
                    <tr key={i} className="hover:bg-blue-50/30">
                      {Object.keys(columnMapping).filter(k => columnMapping[k]).slice(0, 8).map(field => (
                        <td key={field} className="px-3 py-2 text-sm text-gray-700">{row[field] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-amber-800 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Gestion des doublons
              </h4>
              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={duplicateStrategy === 'skip'}
                    onChange={() => setDuplicateStrategy('skip')}
                    className="w-4 h-4 text-[#00375A]"
                  />
                  <span className="text-sm text-gray-700">Ignorer les doublons</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="radio"
                    checked={duplicateStrategy === 'overwrite'}
                    onChange={() => setDuplicateStrategy('overwrite')}
                    className="w-4 h-4 text-[#00375A]"
                  />
                  <span className="text-sm text-gray-700">Écraser les doublons (à venir)</span>
                </label>
              </div>
              <p className="text-xs text-amber-600 mt-2">Un doublon = TAG déjà existant dans la base</p>
            </div>

            <div className="flex space-x-4">
              <button onClick={() => setStep(2)} className="px-6 py-2 border-2 border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                Retour
              </button>
              <button onClick={startImport} className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Lancer l'import</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Importing */}
        {step === 4 && (
          <div className="max-w-xl mx-auto text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#00375A]/10 flex items-center justify-center">
                <Activity className="w-10 h-10 text-[#00375A] animate-pulse" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Import en cours...</h3>
              <p className="text-sm text-gray-500">
                {importProgress.current} / {importProgress.total} enregistrements traités
              </p>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
              <div
                className="bg-[#00375A] h-4 rounded-full transition-all duration-300"
                style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
              />
            </div>

            <div className="flex justify-center space-x-8 text-sm">
              <div>
                <span className="font-semibold text-green-600">{importProgress.inserted}</span>
                <span className="text-gray-500 ml-1">insérés</span>
              </div>
              <div>
                <span className="font-semibold text-amber-600">{importProgress.skipped}</span>
                <span className="text-gray-500 ml-1">ignorés</span>
              </div>
              <div>
                <span className="font-semibold text-red-600">{importProgress.errors}</span>
                <span className="text-gray-500 ml-1">erreurs</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Results */}
        {step === 5 && importResults && (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Import terminé !</h3>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">{importResults.inserted}</div>
                <div className="text-sm text-green-700 font-medium">Insérés</div>
              </div>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-amber-600 mb-1">{importResults.skipped}</div>
                <div className="text-sm text-amber-700 font-medium">Doublons ignorés</div>
              </div>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                <div className="text-3xl font-bold text-red-600 mb-1">{importResults.errors.length}</div>
                <div className="text-sm text-red-700 font-medium">Erreurs</div>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 max-h-64 overflow-y-auto">
                <h4 className="font-semibold text-red-800 mb-2">Détail des erreurs</h4>
                <div className="space-y-2">
                  {importResults.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="text-xs text-red-700 bg-white rounded p-2">
                      <span className="font-mono">Ligne {err.row}:</span> {err.error}
                    </div>
                  ))}
                  {importResults.errors.length > 10 && (
                    <div className="text-xs text-red-600 italic">+ {importResults.errors.length - 10} autres erreurs...</div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-center space-x-4">
              <button onClick={reset} className="px-6 py-3 bg-[#00375A] text-white rounded-lg font-medium hover:bg-[#004A73] transition-colors">
                Nouvel import
              </button>
              <button onClick={() => window.location.reload()} className="px-6 py-3 border-2 border-[#00375A] text-[#00375A] rounded-lg font-medium hover:bg-[#00375A]/5 transition-colors">
                Voir la liste
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
