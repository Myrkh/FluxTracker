import React, { useState, useCallback, useMemo } from 'react';
import Select from 'react-select';
import { Plus, FileText, Building2, Zap, Cable, Save, BookOpen, X } from 'lucide-react';
import { useApp } from '../../../context/OmniLink';
import { Section, FormField, inputClass } from '../common';
import { customSelectStyles } from '../../../constants/OmniLink';
import { AutoFillService } from '../../../services/OmniLink';

export function FormView() {
  const { refData, notify, recordOps } = useApp();

  const emptyForm = {
    tag: '', service: '', function: null, sub_function: null,
    loc: null, name_loc: '', loop_type: null, system: null,
    send_to: '', sig: null, alim: null, isolator: null,
    lightning: null, io_card_type: null, marsh_cabinet: '',
    system_cabinet: '', rack: '', slot: '', io_address: '',
    jb_tag: '', loop_dwg: '', jb_dwg: '', net_type: null,
    obs_ins: '', obs_wir: '', obs_gen: '',
  };

  const [formData, setFormData] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [autoFillSuggestions, setAutoFillSuggestions] = useState({});

  const getAvailableSubFunctions = useMemo(() => {
    if (!formData.function) return [];
    return refData.subFunctions
      .filter(sf => sf.function_code === formData.function.value)
      .map(sf => ({ value: sf.code, label: `${sf.code} — ${sf.description_fr}` }));
  }, [formData.function, refData.subFunctions]);

  // Auto-fill when TAG changes
  const handleTagChange = useCallback((val) => {
    const upper = val.toUpperCase();
    setFormData(prev => ({ ...prev, tag: upper }));
    const suggestions = AutoFillService.suggestFromTag(upper, refData);
    setAutoFillSuggestions(suggestions);
  }, [refData]);

  // Auto-fill when FUNCTION changes
  const handleFunctionChange = useCallback((val) => {
    setFormData(prev => {
      const updates = { ...prev, function: val, sub_function: null };
      if (val) {
        const sugg = AutoFillService.suggestFromFunction(val.value);
        if (sugg.sig && !prev.sig) {
          const sigOption = refData.signals.find(s => s.value === sugg.sig);
          if (sigOption) updates.sig = sigOption;
        }
      }
      return updates;
    });
  }, [refData]);

  // Auto-fill when LOOP_TYPE changes
  const handleLoopTypeChange = useCallback((val) => {
    setFormData(prev => {
      const updates = { ...prev, loop_type: val };
      if (val) {
        const sugg = AutoFillService.suggestFromLoopType(val.value);
        if (sugg.system && !prev.system) {
          const sysOption = refData.systems.find(s => s.value === sugg.system);
          if (sysOption) updates.system = sysOption;
        }
      }
      return updates;
    });
  }, [refData]);

  const acceptSuggestion = useCallback((field, suggestion) => {
    setFormData(prev => ({ ...prev, [field]: suggestion }));
    setAutoFillSuggestions(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const validate = () => {
    const e = {};
    if (!formData.tag) e.tag = 'TAG requis';
    else if (!/^[A-Z0-9\-]+$/.test(formData.tag)) e.tag = 'Format: A-Z, 0-9, tirets';
    else if (formData.tag.length > 15) e.tag = 'Max 15 caractères';
    if (!formData.service) e.service = 'Service requis';
    else if (formData.service.length > 24) e.service = 'Max 24 caractères';
    if (!formData.function) e.function = 'Function requise';
    if (!formData.loc) e.loc = 'Localisation requise';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) { notify('Veuillez corriger les erreurs', 'error'); return; }
    setSaving(true);
    try {
      await recordOps.insert({
        tag: formData.tag, service: formData.service,
        function: formData.function?.value, sub_function: formData.sub_function?.value,
        loc: formData.loc?.value, name_loc: formData.name_loc,
        loop_type: formData.loop_type?.value, system: formData.system?.value,
        send_to: formData.send_to, sig: formData.sig?.value,
        alim: formData.alim?.value, isolator: formData.isolator?.value,
        lightning: formData.lightning?.value, io_card_type: formData.io_card_type?.value,
        marsh_cabinet: formData.marsh_cabinet, system_cabinet: formData.system_cabinet,
        rack: formData.rack, slot: formData.slot, io_address: formData.io_address,
        jb_tag: formData.jb_tag, loop_dwg: formData.loop_dwg, jb_dwg: formData.jb_dwg,
        net_type: formData.net_type?.value,
        obs_ins: formData.obs_ins, obs_wir: formData.obs_wir, obs_gen: formData.obs_gen,
        created_by: 'user@artelia.com'
      });
      notify('Point INS créé avec succès !');
      setFormData(emptyForm);
      setErrors({});
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg"><Plus className="w-6 h-6" /></div>
          <span>Création d'un Nouveau Point INS</span>
        </h2>
        <p className="text-[#00B4D8]/90 mt-2 text-sm">Remplissez les champs — l'auto-complétion vous assistera</p>
      </div>

      {/* Auto-fill banner */}
      {Object.keys(autoFillSuggestions).length > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-8 py-3">
          <div className="flex items-center space-x-2 text-sm text-blue-800">
            <Zap className="w-4 h-4" />
            <span className="font-medium">Suggestions auto :</span>
            {Object.entries(autoFillSuggestions).map(([field, val]) => (
              <button key={field} onClick={() => acceptSuggestion(field, val)}
                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 rounded-full text-xs font-medium transition-colors">
                {field}: {val.label || val.value || val} ✓
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-8 space-y-8">
        {/* Section: Identification */}
        <Section icon={<FileText className="w-5 h-5" />} title="Identification" description="Repérage du point INS">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="TAG" required error={errors.tag} helpText="15 car. max, A-Z 0-9 -">
              <input type="text" value={formData.tag} onChange={e => handleTagChange(e.target.value)}
                className={inputClass(errors.tag)} placeholder="Ex: FT-1001" />
            </FormField>
            <FormField label="SERVICE" required error={errors.service} helpText="24 car. max">
              <input type="text" value={formData.service}
                onChange={e => setFormData({ ...formData, service: e.target.value.toUpperCase() })}
                className={inputClass(errors.service)} placeholder="Ex: P108 REFOULEMENT" />
            </FormField>
            <FormField label="FUNCTION" required error={errors.function}>
              <Select menuPortalTarget={document.body} value={formData.function}
                onChange={handleFunctionChange} options={refData.functions}
                placeholder="Sélectionner..." styles={customSelectStyles} isClearable />
            </FormField>
            <FormField label="SUB FUNCTION">
              <Select menuPortalTarget={document.body} value={formData.sub_function}
                onChange={val => setFormData({ ...formData, sub_function: val })}
                options={getAvailableSubFunctions} placeholder="Sélectionner..."
                styles={customSelectStyles} isDisabled={!formData.function} isClearable />
            </FormField>
          </div>
        </Section>

        {/* Section: Localisation & Système */}
        <Section icon={<Building2 className="w-5 h-5" />} title="Localisation & Système" description="Emplacement et affectation système">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FormField label="LOC" required error={errors.loc}>
              <Select menuPortalTarget={document.body} value={formData.loc}
                onChange={val => setFormData({ ...formData, loc: val })}
                options={refData.locations} placeholder="Sélectionner..."
                styles={customSelectStyles} isClearable />
            </FormField>
            <FormField label="NAME LOC" helpText="Bâtiment">
              <input type="text" value={formData.name_loc}
                onChange={e => setFormData({ ...formData, name_loc: e.target.value })}
                className={inputClass(false)} placeholder="Ex: UNITE 100" />
            </FormField>
            <FormField label="LOOP TYPE">
              <Select menuPortalTarget={document.body} value={formData.loop_type}
                onChange={handleLoopTypeChange} options={refData.loopTypes}
                placeholder="Sélectionner..." styles={customSelectStyles} isClearable />
            </FormField>
            <FormField label="SYSTEM">
              <Select menuPortalTarget={document.body} value={formData.system}
                onChange={val => setFormData({ ...formData, system: val })}
                options={refData.systems} placeholder="Sélectionner..."
                styles={customSelectStyles} isClearable />
            </FormField>
          </div>
        </Section>

        {/* Section: Instrumentation & Signaux */}
        <Section icon={<Zap className="w-5 h-5" />} title="Instrumentation & Signaux" description="Signal, alimentation, protection">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField label="SEND TO" helpText="Destination">
              <input type="text" value={formData.send_to}
                onChange={e => setFormData({ ...formData, send_to: e.target.value })}
                className={inputClass(false)} placeholder="Ex: DCS HPM-01" />
            </FormField>
            <FormField label="SIG">
              <Select menuPortalTarget={document.body} value={formData.sig}
                onChange={val => setFormData({ ...formData, sig: val })}
                options={refData.signals} placeholder="Sélectionner..."
                styles={customSelectStyles} isClearable />
            </FormField>
            <FormField label="ALIM">
              <Select menuPortalTarget={document.body} value={formData.alim}
                onChange={val => setFormData({ ...formData, alim: val })}
                options={refData.alims} placeholder="Sélectionner..."
                styles={customSelectStyles} isClearable />
            </FormField>
            <FormField label="ISOLATOR">
              <Select menuPortalTarget={document.body} value={formData.isolator}
                onChange={val => setFormData({ ...formData, isolator: val })}
                options={refData.isolators} placeholder="Sélectionner..."
                styles={customSelectStyles} isClearable />
            </FormField>
            <FormField label="LIGHTNING">
              <Select menuPortalTarget={document.body} value={formData.lightning}
                onChange={val => setFormData({ ...formData, lightning: val })}
                options={refData.lightnings} placeholder="Sélectionner..."
                styles={customSelectStyles} isClearable />
            </FormField>
            <FormField label="I/O CARD TYPE">
              <Select menuPortalTarget={document.body} value={formData.io_card_type}
                onChange={val => setFormData({ ...formData, io_card_type: val })}
                options={refData.ioCardTypes} placeholder="Sélectionner..."
                styles={customSelectStyles} isClearable />
            </FormField>
          </div>

          {/* Cable spec preview */}
          {formData.sig && SIG_CABLE_MAP[formData.sig.value] && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <div className="flex items-center space-x-2 text-amber-800">
                <Cable className="w-4 h-4" />
                <span className="font-medium">Câble suggéré :</span>
                <span>{SIG_CABLE_MAP[formData.sig.value].type}</span>
                {SIG_CABLE_MAP[formData.sig.value].shield && <span className="text-xs bg-amber-100 px-2 py-0.5 rounded">+ blindage</span>}
              </div>
            </div>
          )}
        </Section>

        {/* Section: Câblage & Adressage */}
        <Section icon={<Cable className="w-5 h-5" />} title="Câblage & Adressage" description="Connexion, armoire, adresse I/O">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField label="MARSH CABINET">
              <input type="text" value={formData.marsh_cabinet}
                onChange={e => setFormData({ ...formData, marsh_cabinet: e.target.value })}
                className={inputClass(false)} placeholder="Ex: MC-01" />
            </FormField>
            <FormField label="SYSTEM CABINET">
              <input type="text" value={formData.system_cabinet}
                onChange={e => setFormData({ ...formData, system_cabinet: e.target.value })}
                className={inputClass(false)} placeholder="Ex: DCS-CAB-01" />
            </FormField>
            <FormField label="RACK">
              <input type="text" value={formData.rack}
                onChange={e => setFormData({ ...formData, rack: e.target.value })}
                className={inputClass(false)} placeholder="Ex: R01" />
            </FormField>
            <FormField label="SLOT">
              <input type="text" value={formData.slot}
                onChange={e => setFormData({ ...formData, slot: e.target.value })}
                className={inputClass(false)} placeholder="Ex: S03" />
            </FormField>
            <FormField label="I/O ADDRESS">
              <input type="text" value={formData.io_address}
                onChange={e => setFormData({ ...formData, io_address: e.target.value })}
                className={inputClass(false)} placeholder="Ex: R01-S03-01" />
            </FormField>
            <FormField label="JB TAG" helpText="Boîte de jonction">
              <input type="text" value={formData.jb_tag}
                onChange={e => setFormData({ ...formData, jb_tag: e.target.value })}
                className={inputClass(false)} placeholder="Ex: JB-100-01" />
            </FormField>
            <FormField label="LOOP DWG" helpText="Plan de boucle">
              <input type="text" value={formData.loop_dwg}
                onChange={e => setFormData({ ...formData, loop_dwg: e.target.value })}
                className={inputClass(false)} placeholder="Ex: LI-100-001" />
            </FormField>
            <FormField label="JB DWG" helpText="Plan JB">
              <input type="text" value={formData.jb_dwg}
                onChange={e => setFormData({ ...formData, jb_dwg: e.target.value })}
                className={inputClass(false)} placeholder="Ex: JB-100-001" />
            </FormField>
            <FormField label="NET TYPE">
              <Select menuPortalTarget={document.body} value={formData.net_type}
                onChange={val => setFormData({ ...formData, net_type: val })}
                options={refData.netTypes} placeholder="Sélectionner..."
                styles={customSelectStyles} isClearable />
            </FormField>
          </div>
        </Section>

        {/* Section: Observations */}
        <Section icon={<BookOpen className="w-5 h-5" />} title="Observations" description="Notes complémentaires" collapsible defaultOpen={false}>
          <div className="grid grid-cols-1 gap-6">
            <FormField label="OBS INS" helpText="Instrumentation">
              <textarea value={formData.obs_ins} rows="2"
                onChange={e => setFormData({ ...formData, obs_ins: e.target.value })}
                className={`${inputClass(false)} resize-none`} placeholder="Notes instrumentation..." />
            </FormField>
            <FormField label="OBS WIR" helpText="Câblage">
              <textarea value={formData.obs_wir} rows="2"
                onChange={e => setFormData({ ...formData, obs_wir: e.target.value })}
                className={`${inputClass(false)} resize-none`} placeholder="Notes câblage..." />
            </FormField>
            <FormField label="OBS GEN" helpText="Général">
              <textarea value={formData.obs_gen} rows="2"
                onChange={e => setFormData({ ...formData, obs_gen: e.target.value })}
                className={`${inputClass(false)} resize-none`} placeholder="Notes générales..." />
            </FormField>
          </div>
        </Section>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t-2 border-gray-200">
          <button type="button" onClick={() => { setFormData(emptyForm); setErrors({}); }}
            className="px-6 py-3 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200 flex items-center space-x-2">
            <X className="w-4 h-4" /><span>Réinitialiser</span>
          </button>
          <button type="submit" disabled={saving}
            className="px-8 py-3 rounded-lg font-medium text-white bg-gradient-to-r from-[#00375A] to-[#0091D5] hover:shadow-xl transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 transform hover:-translate-y-0.5">
            <Save className="w-4 h-4" /><span>{saving ? 'Enregistrement...' : 'Enregistrer le Point'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: LIST VIEW
// ─────────────────────────────────────────────────────────

