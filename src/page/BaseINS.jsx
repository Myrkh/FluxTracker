import React, { useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/horizonData';
import Select from 'react-select';
import {
  Download, Save, Plus, Search, FileText, Building2, Zap, Cable, X,
  CheckCircle2, AlertCircle, BarChart3, GitBranch, BookOpen, Settings,
  RefreshCw, Filter, ChevronDown, ChevronRight, Trash2, Edit3,
  Copy, Eye, Upload, Activity, Database, Layers, Shield, Box,
  LogOut, Home
} from 'lucide-react';
import ExcelJS from 'exceljs';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, Area, AreaChart
} from 'recharts';

// ─────────────────────────────────────────────────────────
// CONTEXT: App-wide state
// ─────────────────────────────────────────────────────────
const AppContext = createContext(null);

function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ─────────────────────────────────────────────────────────
// CONSTANTS & MAPPINGS (Auto-fill intelligence)
// ─────────────────────────────────────────────────────────

// TAG first letter → likely measurement type
const TAG_FUNCTION_MAP = {
  F: ['CORIOLIS', 'ELECTRO MAGNETIC', 'PRESSURE DP', 'VORTEX', 'TURBINE', 'FLOW SWITCH'],
  P: ['PRESSURE REL', 'PRESSURE ABS', 'PRESSURE DP', 'PRESSURE SWITCH', 'PRESSURE GAUGE'],
  T: ['THERMOCOUPLE', 'RTD', 'TEMPERATURE SWITCH', 'THERMOMETER'],
  L: ['RADAR', 'GUIDED WAVE RADAR', 'LEVEL SWITCH', 'CAPACITIVE', 'LEVEL ULTRASON'],
  A: ['ANALYSER', 'PHMETER', 'CHROMATO', 'O2', 'H2S'],
  S: ['SPEED', 'VIBRATION', 'ACCELEROMETER'],
  V: ['CONTROL VALVE', 'ON OFF VALVE', 'SOLENOID SPRING'],
  Z: ['VALVE POSITION', 'LIMIT SWITCH'],
  H: ['HAND VALVE'],
  X: ['ALARM', 'FIRE DETECTOR', 'GAS DETECTOR HC', 'GAS DETECTOR H2S'],
};

// FUNCTION → suggested SIG
const FUNCTION_SIG_MAP = {
  'CORIOLIS': 'AI10', 'ELECTRO MAGNETIC': 'AI10', 'PRESSURE DP': 'AI10',
  'VORTEX': 'AI10', 'TURBINE': 'DI20', 'FLOW SWITCH': 'DI10',
  'PRESSURE REL': 'AI10', 'PRESSURE ABS': 'AI10', 'PRESSURE SWITCH': 'DI10',
  'THERMOCOUPLE': 'AI31', 'RTD': 'AI40', 'TEMPERATURE SWITCH': 'DI10',
  'RADAR': 'AI10', 'GUIDED WAVE RADAR': 'AI10', 'LEVEL SWITCH': 'DI10',
  'CAPACITIVE': 'AI10', 'LEVEL ULTRASON': 'AI10',
  'ANALYSER': 'AI12', 'PHMETER': 'AI12', 'CHROMATO': 'AI12',
  'CONTROL VALVE': 'AO10', 'ON OFF VALVE': 'DO10', 'SOLENOID SPRING': 'DO10',
  'VALVE POSITION': 'DI10', 'LIMIT SWITCH': 'DI10',
  'FIRE DETECTOR': 'DI10', 'GAS DETECTOR HC': 'AI10', 'GAS DETECTOR H2S': 'AI10',
  'SPEED': 'AI10', 'VIBRATION': 'AI10', 'ACCELEROMETER': 'AI10',
};

// LOOP_TYPE → suggested SYSTEM
const LOOP_SYSTEM_MAP = {
  'BPCS': 'DCS', 'SIS': 'S-PLC', 'MAINT': 'DIV'
};

// SIG → cable specification
const SIG_CABLE_MAP = {
  'AI10': { type: '2×1.5mm² blindé', pairs: 1, shield: true },
  'AI11': { type: '2×1.5mm² blindé', pairs: 1, shield: true },
  'AI12': { type: '2×1.5mm²', pairs: 1, shield: false },
  'AI31': { type: '2×0.5mm² TC (K)', pairs: 1, shield: true },
  'AI40': { type: '3×1mm²', pairs: 1, shield: true },
  'DI10': { type: '2×1mm²', pairs: 1, shield: false },
  'DI20': { type: '2×1mm² blindé', pairs: 1, shield: true },
  'AO10': { type: '2×1.5mm² blindé', pairs: 1, shield: true },
  'DO10': { type: '2×1.5mm²', pairs: 1, shield: false },
  'DO11': { type: '2×1.5mm²', pairs: 1, shield: false },
};

// Artelia brand colors
const COLORS = {
  primary: '#00375A',
  light: '#0091D5',
  accent: '#00B4D8',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  sis: '#DC2626',
  bpcs: '#2563EB',
  maint: '#059669',
};

const PIE_COLORS = ['#00375A', '#0091D5', '#00B4D8', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// ─────────────────────────────────────────────────────────
// CUSTOM SELECT STYLES (Artelia brand)
// ─────────────────────────────────────────────────────────
const customSelectStyles = {
  control: (base, state) => ({
    ...base,
    minHeight: '44px',
    borderRadius: '0.5rem',
    borderWidth: '2px',
    borderColor: state.isFocused ? '#00375A' : '#E2E8F0',
    boxShadow: state.isFocused ? '0 0 0 4px rgba(0, 55, 90, 0.1)' : 'none',
    '&:hover': { borderColor: '#0091D5' },
    fontSize: '0.875rem',
  }),
  option: (base, state) => ({
    ...base,
    backgroundColor: state.isSelected ? '#00375A' : state.isFocused ? 'rgba(0, 55, 90, 0.05)' : 'white',
    color: state.isSelected ? 'white' : '#1E293B',
    cursor: 'pointer',
    fontSize: '0.875rem',
    '&:active': { backgroundColor: '#00375A' }
  }),
  menu: (base) => ({
    ...base, borderRadius: '0.5rem',
    boxShadow: '0 10px 15px -3px rgba(0, 55, 90, 0.1), 0 4px 6px -2px rgba(0, 55, 90, 0.05)',
    border: '2px solid #E2E8F0', overflow: 'hidden', marginTop: '0.5rem'
  }),
  menuPortal: base => ({ ...base, zIndex: 9999 }),
};

// ─────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────

/** Load and cache all reference data from Supabase */
function useReferenceData() {
  const [refData, setRefData] = useState({
    functions: [], subFunctions: [], locations: [], loopTypes: [],
    systems: [], signals: [], alims: [], isolators: [],
    lightnings: [], ioCardTypes: [], netTypes: [],
    raw: {} // keep raw data for lookups
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tables = [
        'ref_function', 'ref_sub_function', 'ref_loc', 'ref_loop_type',
        'ref_system', 'ref_sig', 'ref_alim', 'ref_isolator',
        'ref_lightning', 'ref_io_card_type', 'ref_net_type'
      ];
      const results = await Promise.all(
        tables.map(t => supabase.from(t).select('*').order('code'))
      );

      const [functions, subFunctions, locations, loopTypes, systems,
        signals, alims, isolators, lightnings, ioCardTypes, netTypes] =
        results.map(r => r.data || []);

      const fmt = (arr, showCat = false) => arr.map(item => ({
        value: item.code,
        label: `${item.code} — ${item.description_fr || ''}`,
        ...item
      }));

      setRefData({
        functions: fmt(functions),
        subFunctions: subFunctions,
        locations: fmt(locations),
        loopTypes: fmt(loopTypes),
        systems: fmt(systems),
        signals: fmt(signals),
        alims: fmt(alims),
        isolators: fmt(isolators),
        lightnings: fmt(lightnings),
        ioCardTypes: fmt(ioCardTypes),
        netTypes: fmt(netTypes),
        raw: { functions, subFunctions, locations, loopTypes, systems, signals, alims, isolators, lightnings, ioCardTypes, netTypes }
      });
    } catch (err) {
      console.error('Error loading reference data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { refData, loading, reload: load };
}

/** CRUD operations for ins_records */
function useRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ins_records')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRecords(data || []);
      computeStats(data || []);
    } catch (err) {
      console.error('Error loading records:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const computeStats = (data) => {
    if (!data.length) { setStats(null); return; }
    const byLoopType = {};
    const bySystem = {};
    const byFunction = {};
    const byLoc = {};
    const bySig = {};
    let missingIO = 0;
    let missingJB = 0;

    data.forEach(r => {
      byLoopType[r.loop_type || 'N/A'] = (byLoopType[r.loop_type || 'N/A'] || 0) + 1;
      bySystem[r.system || 'N/A'] = (bySystem[r.system || 'N/A'] || 0) + 1;
      byFunction[r.function || 'N/A'] = (byFunction[r.function || 'N/A'] || 0) + 1;
      byLoc[r.loc || 'N/A'] = (byLoc[r.loc || 'N/A'] || 0) + 1;
      bySig[r.sig || 'N/A'] = (bySig[r.sig || 'N/A'] || 0) + 1;
      if (!r.io_address) missingIO++;
      if (!r.jb_tag) missingJB++;
    });

    const toChartData = (obj) => Object.entries(obj)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    setStats({
      total: data.length,
      byLoopType: toChartData(byLoopType),
      bySystem: toChartData(bySystem),
      byFunction: toChartData(byFunction).slice(0, 15),
      byLoc: toChartData(byLoc),
      bySig: toChartData(bySig).slice(0, 12),
      missingIO, missingJB,
      completeness: Math.round(((data.length - missingIO) / data.length) * 100),
    });
  };

  const insert = async (formData) => {
    const { data, error } = await supabase.from('ins_records').insert([formData]).select();
    if (error) throw error;
    await load();
    return data;
  };

  const update = async (id, formData) => {
    const { data, error } = await supabase.from('ins_records').update(formData).eq('id', id).select();
    if (error) throw error;
    await load();
    return data;
  };

  const remove = async (id) => {
    const { error } = await supabase.from('ins_records').delete().eq('id', id);
    if (error) throw error;
    await load();
  };

  useEffect(() => { load(); }, [load]);
  return { records, loading, stats, reload: load, insert, update, remove };
}

/** Notification system */
function useNotification() {
  const [notification, setNotification] = useState(null);
  const show = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);
  return { notification, show, clear: () => setNotification(null) };
}

// ─────────────────────────────────────────────────────────
// AUTO-FILL SERVICE
// ─────────────────────────────────────────────────────────
const AutoFillService = {
  suggestFromTag(tag, refData) {
    if (!tag || tag.length < 2) return {};
    const firstLetter = tag.charAt(0);
    const secondLetter = tag.charAt(1);
    const suggestions = {};

    // Suggest functions based on first letter
    const possibleFunctions = TAG_FUNCTION_MAP[firstLetter];
    if (possibleFunctions) {
      const match = refData.functions.find(f => possibleFunctions.includes(f.value));
      if (match) suggestions.function = match;
    }

    return suggestions;
  },

  suggestFromFunction(functionCode) {
    const suggestions = {};
    const sig = FUNCTION_SIG_MAP[functionCode];
    if (sig) suggestions.sig = sig;
    return suggestions;
  },

  suggestFromLoopType(loopType) {
    const suggestions = {};
    const system = LOOP_SYSTEM_MAP[loopType];
    if (system) suggestions.system = system;
    return suggestions;
  },

  getCableSpec(sigCode) {
    return SIG_CABLE_MAP[sigCode] || null;
  }
};

// ─────────────────────────────────────────────────────────
// EXPORT SERVICE
// ─────────────────────────────────────────────────────────
const ExportService = {
  async toExcel(records) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'INS Database - Artelia';
    const ws = workbook.addWorksheet('EXCHANGE');

    const columns = [
      { header: 'REV', key: 'rev', width: 13 },
      { header: 'TAG', key: 'tag', width: 15 },
      { header: 'SERVICE', key: 'service', width: 24 },
      { header: 'FUNCTION', key: 'function', width: 18 },
      { header: 'SUB_FUNCTION', key: 'sub_function', width: 18 },
      { header: 'LOC', key: 'loc', width: 6 },
      { header: 'NAME_LOC', key: 'name_loc', width: 15 },
      { header: 'LOOP_TYPE', key: 'loop_type', width: 8 },
      { header: 'SYSTEM', key: 'system', width: 10 },
      { header: 'NUM', key: 'num', width: 5 },
      { header: 'SEC', key: 'sec', width: 10 },
      { header: 'SEND_TO', key: 'send_to', width: 12 },
      { header: 'SIG', key: 'sig', width: 8 },
      { header: 'ALIM', key: 'alim', width: 6 },
      { header: 'ISOLATOR', key: 'isolator', width: 14 },
      { header: 'LIGHTNING', key: 'lightning', width: 10 },
      { header: 'I/O_CARD_TYPE', key: 'io_card_type', width: 8 },
      { header: 'MARSH_CABINET', key: 'marsh_cabinet', width: 14 },
      { header: 'SYSTEM_CABINET', key: 'system_cabinet', width: 14 },
      { header: 'RACK', key: 'rack', width: 10 },
      { header: 'SLOT', key: 'slot', width: 10 },
      { header: 'I/O_ADDRESS', key: 'io_address', width: 12 },
      { header: 'JB_TAG', key: 'jb_tag', width: 16 },
      { header: 'LOOP_DWG', key: 'loop_dwg', width: 20 },
      { header: 'JB_DWG', key: 'jb_dwg', width: 20 },
      { header: 'NET_TYPE', key: 'net_type', width: 10 },
      { header: 'NET_DB_REF', key: 'net_db_ref', width: 20 },
      { header: 'OBS_INS', key: 'obs_ins', width: 40 },
      { header: 'OBS_WIR', key: 'obs_wir', width: 40 },
      { header: 'OBS_GEN', key: 'obs_gen', width: 40 },
    ];
    ws.columns = columns;

    // Style header
    ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00375A' } };
    ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    ws.getRow(1).height = 28;

    records.forEach(r => ws.addRow(r));

    // Alternate row colors
    ws.eachRow((row, idx) => {
      if (idx > 1 && idx % 2 === 0) {
        row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7FF' } };
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `INS_Export_Artelia_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);
  }
};

// ─────────────────────────────────────────────────────────
// SHARED UI COMPONENTS
// ─────────────────────────────────────────────────────────

function NotificationToast({ notification, onClose }) {
  if (!notification) return null;
  const isSuccess = notification.type === 'success';
  return (
    <div className={`fixed top-4 right-4 z-50 animate-in slide-in-from-top-5 duration-300 ${
      isSuccess ? 'bg-green-50 border-green-200 border-l-green-500' : 'bg-red-50 border-red-200 border-l-red-500'
    } border-l-4 px-4 py-3 rounded-lg shadow-xl max-w-md`}>
      <div className="flex items-start space-x-3">
        {isSuccess ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" /> :
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
        <p className={`text-sm font-medium ${isSuccess ? 'text-green-900' : 'text-red-900'}`}>
          {notification.message}
        </p>
        <button onClick={onClose} className="flex-shrink-0 text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function Section({ icon, title, description, children, collapsible = false, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-gradient-to-br from-white to-gray-50/30">
      <div
        className={`bg-[#00375A]/5 border-b-2 border-gray-200 px-6 py-4 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={() => collapsible && setOpen(!open)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-[#00375A] bg-white p-2 rounded-lg shadow-sm">{icon}</div>
            <div>
              <h3 className="text-lg font-bold text-[#00375A]">{title}</h3>
              {description && <p className="text-sm text-gray-600 mt-0.5">{description}</p>}
            </div>
          </div>
          {collapsible && (open ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />)}
        </div>
      </div>
      {(!collapsible || open) && <div className="p-6">{children}</div>}
    </div>
  );
}

function FormField({ label, required, error, helpText, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
        {helpText && <span className="ml-2 text-xs font-normal text-gray-500">({helpText})</span>}
      </label>
      {children}
      {error && (
        <p className="text-sm text-red-600 flex items-center space-x-1">
          <AlertCircle className="w-3.5 h-3.5" /><span>{error}</span>
        </p>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, sub, color = '#00375A' }) {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-100 p-5 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${color}10` }}>
          {React.cloneElement(icon, { className: 'w-5 h-5', style: { color } })}
        </div>
      </div>
    </div>
  );
}

function Badge({ children, variant = 'default' }) {
  const styles = {
    BPCS: 'bg-blue-100 text-blue-800',
    SIS: 'bg-red-100 text-red-800',
    MAINT: 'bg-green-100 text-green-800',
    default: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant] || styles.default}`}>
      {children}
    </span>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      {React.cloneElement(icon, { className: 'w-16 h-16 mb-4 text-gray-300' })}
      <p className="text-lg font-semibold text-gray-500">{title}</p>
      {description && <p className="text-sm mt-1">{description}</p>}
    </div>
  );
}

const inputClass = (hasError) => `w-full px-4 py-2.5 rounded-lg border-2 transition-all duration-200 text-sm ${
  hasError
    ? 'border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
    : 'border-gray-200 focus:border-[#00375A] focus:ring-4 focus:ring-[#00375A]/10'
} outline-none`;

// ─────────────────────────────────────────────────────────
// TAB: FORM VIEW (Nouveau Point)
// ─────────────────────────────────────────────────────────

function FormView() {
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

function ListView() {
  const { records, notify, recordOps } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLoopType, setFilterLoopType] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const filtered = useMemo(() => {
    return records.filter(r => {
      const matchSearch = !searchTerm ||
        r.tag?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.function?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchLoop = !filterLoopType || r.loop_type === filterLoopType;
      return matchSearch && matchLoop;
    });
  }, [records, searchTerm, filterLoopType]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(r => r.id)));
  };

  const handleExport = async () => {
    try {
      const toExport = selectedIds.size > 0
        ? records.filter(r => selectedIds.has(r.id))
        : records;
      await ExportService.toExcel(toExport);
      notify(`Export de ${toExport.length} points réussi !`);
    } catch (err) {
      notify('Erreur export: ' + err.message, 'error');
    }
  };

  const handleDelete = async (id, tag) => {
    if (!window.confirm(`Supprimer le point ${tag} ?`)) return;
    try {
      await recordOps.remove(id);
      notify(`Point ${tag} supprimé`);
      setSelectedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    } catch (err) {
      notify('Erreur: ' + err.message, 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-8 py-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-lg"><Database className="w-6 h-6" /></div>
              <span>Liste des Points INS</span>
            </h2>
            <p className="text-[#00B4D8]/80 mt-1 text-sm">{records.length} point{records.length > 1 ? 's' : ''} enregistré{records.length > 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedIds.size > 0 && (
              <span className="text-white/80 text-sm">{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
            )}
            <button onClick={handleExport}
              className="px-5 py-2.5 bg-white text-[#00375A] rounded-lg font-medium hover:bg-[#00B4D8] hover:text-white transition-all duration-200 flex items-center space-x-2 shadow-lg">
              <Download className="w-4 h-4" /><span>Export Excel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Rechercher TAG, SERVICE, FUNCTION..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg border-2 border-gray-200 focus:border-[#00375A] focus:ring-4 focus:ring-[#00375A]/10 outline-none transition-all text-sm" />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            {['BPCS', 'SIS', 'MAINT'].map(lt => (
              <button key={lt} onClick={() => setFilterLoopType(filterLoopType === lt ? null : lt)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  filterLoopType === lt ? 'bg-[#00375A] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{lt}</button>
            ))}
            {filterLoopType && (
              <button onClick={() => setFilterLoopType(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-lg border-2 border-gray-200">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll} className="rounded border-gray-300" />
                </th>
                {['TAG', 'SERVICE', 'FUNCTION', 'LOC', 'LOOP TYPE', 'SYSTEM', 'SIG', 'RACK', 'SLOT', 'I/O ADDRESS', 'JB TAG', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan="12"><EmptyState icon={<Database />} title="Aucun point trouvé" description="Modifiez vos filtres ou créez un nouveau point" /></td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} className={`hover:bg-blue-50/30 transition-colors ${selectedIds.has(r.id) ? 'bg-blue-50/50' : ''}`}>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)} className="rounded border-gray-300" />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap"><span className="font-bold text-[#00375A]">{r.tag}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-700 max-w-[200px] truncate">{r.service}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{r.function}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.loc}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{r.loop_type && <Badge variant={r.loop_type}>{r.loop_type}</Badge>}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.system}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">{r.sig}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{r.rack}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{r.slot}</td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{r.io_address}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.jb_tag}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <button onClick={() => handleDelete(r.id, r.tag)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 text-sm text-gray-500 text-right">
          {filtered.length} résultat{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: DASHBOARD
// ─────────────────────────────────────────────────────────

function DashboardView() {
  const { records, stats } = useApp();

  if (!stats || records.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12">
        <EmptyState icon={<BarChart3 />} title="Pas encore de données"
          description="Créez des points INS pour voir les statistiques" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Database />} label="Total Points" value={stats.total} color={COLORS.primary} />
        <StatCard icon={<Shield />} label="Points SIS" value={stats.byLoopType.find(l => l.name === 'SIS')?.value || 0}
          sub="Sécurité instrumentée" color={COLORS.sis} />
        <StatCard icon={<Activity />} label="Complétude I/O" value={`${stats.completeness}%`}
          sub={`${stats.missingIO} adresses manquantes`} color={stats.completeness > 80 ? COLORS.success : COLORS.warning} />
        <StatCard icon={<Box />} label="JB manquantes" value={stats.missingJB}
          sub="Points sans boîte de jonction" color={stats.missingJB > 0 ? COLORS.warning : COLORS.success} />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loop Type Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-[#00375A] mb-4">Répartition par Loop Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.byLoopType} cx="50%" cy="50%" outerRadius={90} innerRadius={50}
                paddingAngle={3} dataKey="value" label={({ name, value }) => `${name} (${value})`}>
                {stats.byLoopType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* System Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-[#00375A] mb-4">Répartition par Système</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.bySystem}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0091D5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Function Distribution (Top 15) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-[#00375A] mb-4">Top Functions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.byFunction} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} width={140} />
              <Tooltip />
              <Bar dataKey="value" fill="#00375A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Signal Type Distribution */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-[#00375A] mb-4">Types de Signaux</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.bySig}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {stats.bySig.map((entry, i) => (
                  <Cell key={i} fill={
                    entry.name.startsWith('AI') ? '#0091D5' :
                    entry.name.startsWith('DI') ? '#10B981' :
                    entry.name.startsWith('AO') ? '#F59E0B' :
                    entry.name.startsWith('DO') ? '#EF4444' : '#6B7280'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Location Distribution */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-[#00375A] mb-4">Répartition par Localisation</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={stats.byLoc}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#00375A" fill="#00375A" fillOpacity={0.15} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: LOOP DIAGRAM (Preview SVG)
// ─────────────────────────────────────────────────────────

function LoopDiagramView() {
  const { records } = useApp();
  const [selectedTag, setSelectedTag] = useState(null);

  const record = useMemo(() =>
    records.find(r => r.tag === selectedTag?.value), [records, selectedTag]
  );

  const tagOptions = useMemo(() =>
    records.map(r => ({ value: r.tag, label: `${r.tag} — ${r.service || ''}` })),
    [records]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg"><GitBranch className="w-6 h-6" /></div>
            <span>Schéma de Boucle (Loop Diagram)</span>
          </h2>
          <p className="text-[#00B4D8]/80 mt-1 text-sm">Sélectionnez un point pour prévisualiser et générer le schéma</p>
        </div>

        <div className="p-6">
          <div className="max-w-md mb-6">
            <FormField label="Sélectionner un TAG">
              <Select value={selectedTag} onChange={setSelectedTag}
                options={tagOptions} placeholder="Choisir un point INS..."
                styles={customSelectStyles} isClearable />
            </FormField>
          </div>

          {record ? (
            <LoopDiagramSVG record={record} />
          ) : (
            <EmptyState icon={<GitBranch />} title="Aucun point sélectionné"
              description="Sélectionnez un TAG pour voir le schéma de boucle" />
          )}
        </div>
      </div>
    </div>
  );
}

/** SVG-based Loop Diagram Preview */
function LoopDiagramSVG({ record }) {
  const cableSpec = AutoFillService.getCableSpec(record.sig);
  const isSIS = record.loop_type === 'SIS';
  const isAnalog = record.sig?.startsWith('AI') || record.sig?.startsWith('AO');

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-sm text-gray-600">
          <span className="font-bold text-[#00375A]">{record.tag}</span>
          <span>—</span>
          <span>{record.service}</span>
          {isSIS && <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded">SIS</span>}
        </div>
        <div className="text-xs text-gray-400">Phase 3 : Export PDF/DXF à venir</div>
      </div>

      {/* SVG Canvas */}
      <svg viewBox="0 0 840 500" className="w-full" style={{ maxHeight: '500px' }}>
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="840" height="500" fill="url(#grid)" />

        {/* ── PROCESS PIPE ── */}
        <line x1="60" y1="80" x2="280" y2="80" stroke="#000" strokeWidth="4" />
        <polygon points="250,72 270,80 250,88" fill="#000" />
        <text x="170" y="65" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#333">{record.service || 'PROCESS'}</text>

        {/* ── INSTRUMENT (ISA circle) ── */}
        <line x1="170" y1="80" x2="170" y2="120" stroke="#000" strokeWidth="2" />
        <circle cx="170" cy="155" r="35" fill="white" stroke={isSIS ? '#DC2626' : '#000'} strokeWidth={isSIS ? 3 : 2} />
        {isSIS && <line x1="135" y1="155" x2="205" y2="155" stroke="#DC2626" strokeWidth="1.5" />}
        <text x="170" y="150" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#00375A">{record.tag}</text>
        <text x="170" y="167" textAnchor="middle" fontSize="9" fill="#666">{record.sig || ''}</text>

        {/* ── Instrument details ── */}
        <text x="220" y="130" fontSize="9" fill="#333">Function: {record.function || 'N/A'}</text>
        <text x="220" y="145" fontSize="9" fill="#666">Sub: {record.sub_function || 'N/A'}</text>
        <text x="220" y="160" fontSize="9" fill="#666">Loc: {record.loc || 'N/A'} {record.name_loc || ''}</text>

        {/* ── WIRING ── */}
        <line x1="170" y1="190" x2="170" y2="260"
          stroke="#000" strokeWidth="1.5"
          strokeDasharray={isAnalog ? 'none' : '6,4'} />
        {cableSpec && (
          <text x="185" y="230" fontSize="8" fill="#0091D5">{cableSpec.type}</text>
        )}
        {record.isolator && record.isolator !== 'NR' && (
          <>
            <rect x="150" y="225" width="40" height="16" rx="2" fill="#FFF7ED" stroke="#F59E0B" />
            <text x="170" y="236" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#B45309">{record.isolator?.replace('IS+GALV ', 'IS+G ')}</text>
          </>
        )}

        {/* ── JUNCTION BOX ── */}
        {record.jb_tag ? (
          <>
            <rect x="145" y="260" width="50" height="35" fill="white" stroke="#000" strokeWidth="2" />
            <line x1="145" y1="277" x2="195" y2="277" stroke="#000" strokeWidth="1" />
            <line x1="170" y1="260" x2="170" y2="295" stroke="#000" strokeWidth="1" />
            <text x="170" y="318" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#333">{record.jb_tag}</text>
            <text x="170" y="330" textAnchor="middle" fontSize="7" fill="#999">JB DWG: {record.jb_dwg || 'N/A'}</text>
          </>
        ) : (
          <text x="170" y="280" textAnchor="middle" fontSize="8" fill="#F59E0B">⚠ JB non définie</text>
        )}

        {/* ── CABLE from JB to Marshalling ── */}
        <line x1="170" y1={record.jb_tag ? 295 : 285} x2="170" y2="360"
          stroke="#000" strokeWidth="1.5" strokeDasharray={isAnalog ? 'none' : '6,4'} />
        {record.lightning && record.lightning !== 'NR' && (
          <>
            <text x="185" y="345" fontSize="7" fill="#7C3AED">⚡ {record.lightning}</text>
          </>
        )}

        {/* ── MARSH CABINET ── */}
        {record.marsh_cabinet && (
          <>
            <rect x="130" y="360" width="80" height="30" fill="#F8FAFC" stroke="#000" strokeWidth="1.5" rx="3" />
            <text x="170" y="380" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#333">{record.marsh_cabinet}</text>
            <text x="170" y="400" textAnchor="middle" fontSize="7" fill="#999">Arm. Raccordement</text>
          </>
        )}

        {/* ── I/O CARD ── */}
        <line x1="210" y1="375" x2="400" y2="375" stroke="#000" strokeWidth="1.5" />
        <rect x="400" y="355" width="120" height="40" fill="#EFF6FF" stroke="#00375A" strokeWidth="2" rx="4" />
        <text x="460" y="372" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#00375A">{record.system || 'SYSTEM'}</text>
        <text x="460" y="387" textAnchor="middle" fontSize="8" fill="#666">{record.io_address || 'No I/O'}</text>

        {/* I/O details */}
        <text x="535" y="355" fontSize="8" fill="#333">Cabinet: {record.system_cabinet || 'N/A'}</text>
        <text x="535" y="368" fontSize="8" fill="#333">Rack: {record.rack || 'N/A'} / Slot: {record.slot || 'N/A'}</text>
        <text x="535" y="381" fontSize="8" fill="#333">Card: {record.io_card_type || 'N/A'} | ALIM: {record.alim || 'N/A'}</text>
        {record.net_type && <text x="535" y="394" fontSize="8" fill="#0091D5">Network: {record.net_type}</text>}

        {/* ── SYSTEM BOX ── */}
        <rect x="600" y="80" width="180" height="180" fill="white" stroke="#00375A" strokeWidth="2.5" rx="6" />
        <rect x="600" y="80" width="180" height="30" fill="#00375A" rx="6" />
        <rect x="600" y="100" width="180" height="10" fill="#00375A" />
        <text x="690" y="100" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white">{record.system || 'DCS'}</text>

        <text x="615" y="130" fontSize="10" fill="#333">Loop Type: <tspan fontWeight="bold" fill={isSIS ? '#DC2626' : '#00375A'}>{record.loop_type || 'N/A'}</tspan></text>
        <text x="615" y="150" fontSize="10" fill="#333">Sec: {record.sec || 'N/A'}</text>
        <text x="615" y="170" fontSize="10" fill="#333">Send To: {record.send_to || 'N/A'}</text>
        {record.net_type && <text x="615" y="190" fontSize="10" fill="#333">Net: {record.net_type}</text>}
        <text x="615" y="210" fontSize="9" fill="#666">Num: {record.num || 'N/A'}</text>
        <text x="615" y="230" fontSize="9" fill="#666">DWG: {record.loop_dwg || 'N/A'}</text>

        {/* Link I/O → System */}
        <line x1="520" y1="375" x2="560" y2="375" stroke="#000" strokeWidth="1.5" />
        <line x1="560" y1="375" x2="560" y2="200" stroke="#000" strokeWidth="1.5" />
        <line x1="560" y1="200" x2="600" y2="200" stroke="#000" strokeWidth="1.5" />
        <polygon points="595,195 605,200 595,205" fill="#00375A" />

        {/* ── TITLE BLOCK ── */}
        <rect x="30" y="430" width="780" height="55" fill="white" stroke="#000" strokeWidth="2" />
        <line x1="400" y1="430" x2="400" y2="485" stroke="#000" />
        <line x1="600" y1="430" x2="600" y2="485" stroke="#000" />
        <line x1="710" y1="430" x2="710" y2="485" stroke="#000" />
        <line x1="30" y1="455" x2="810" y2="455" stroke="#000" />

        <text x="45" y="448" fontSize="9" fill="#666">LOOP DIAGRAM</text>
        <text x="45" y="475" fontSize="16" fontWeight="bold" fill="#00375A">{record.tag}</text>
        <text x="415" y="448" fontSize="9" fill="#666">{record.service}</text>
        <text x="415" y="475" fontSize="9" fill="#333">Function: {record.function} | Loop: {record.loop_type} | System: {record.system}</text>
        <text x="615" y="448" fontSize="9" fill="#666">DWG: {record.loop_dwg || 'N/A'}</text>
        <text x="615" y="475" fontSize="9" fill="#333">Date: {new Date().toLocaleDateString('fr-FR')}</text>
        <text x="725" y="448" fontSize="9" fill="#666">Rev: {record.rev || '001.0000'}</text>
        <text x="725" y="475" fontSize="9" fill="#333">Sheet: 1/1</text>

        {/* ── NOTES ── */}
        {(record.obs_ins || record.obs_wir) && (
          <>
            <text x="400" y="135" fontSize="9" fontWeight="bold" fill="#333">NOTES:</text>
            {record.obs_ins && <text x="400" y="150" fontSize="8" fill="#666">INS: {record.obs_ins.substring(0, 50)}</text>}
            {record.obs_wir && <text x="400" y="165" fontSize="8" fill="#666">WIR: {record.obs_wir.substring(0, 50)}</text>}
          </>
        )}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: JB DIAGRAM (Preview SVG)
// ─────────────────────────────────────────────────────────

function JBDiagramView() {
  const { records } = useApp();

  const jbGroups = useMemo(() => {
    const groups = {};
    records.forEach(r => {
      if (r.jb_tag) {
        if (!groups[r.jb_tag]) groups[r.jb_tag] = [];
        groups[r.jb_tag].push(r);
      }
    });
    return groups;
  }, [records]);

  const jbOptions = useMemo(() =>
    Object.keys(jbGroups).map(jb => ({ value: jb, label: `${jb} (${jbGroups[jb].length} points)` })),
    [jbGroups]
  );

  const [selectedJB, setSelectedJB] = useState(null);
  const jbRecords = selectedJB ? jbGroups[selectedJB.value] || [] : [];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
            <div className="bg-white/20 p-2 rounded-lg"><Box className="w-6 h-6" /></div>
            <span>Schéma de Boîte de Jonction (JB)</span>
          </h2>
          <p className="text-[#00B4D8]/80 mt-1 text-sm">{Object.keys(jbGroups).length} JB détectée{Object.keys(jbGroups).length > 1 ? 's' : ''} dans la base</p>
        </div>

        <div className="p-6">
          <div className="max-w-md mb-6">
            <FormField label="Sélectionner une Boîte de Jonction">
              <Select value={selectedJB} onChange={setSelectedJB}
                options={jbOptions} placeholder="Choisir une JB..."
                styles={customSelectStyles} isClearable />
            </FormField>
          </div>

          {selectedJB && jbRecords.length > 0 ? (
            <JBDiagramSVG jbTag={selectedJB.value} records={jbRecords} />
          ) : (
            <EmptyState icon={<Box />} title={Object.keys(jbGroups).length === 0 ? 'Aucune JB définie' : 'Sélectionnez une JB'}
              description={Object.keys(jbGroups).length === 0
                ? "Ajoutez des JB_TAG dans vos points pour voir les schémas"
                : "Choisissez une boîte de jonction dans la liste"} />
          )}
        </div>
      </div>
    </div>
  );
}

/** SVG-based JB Diagram */
function JBDiagramSVG({ jbTag, records }) {
  const rowH = 28;
  const headerH = 40;
  const boxH = headerH + records.length * rowH + 20;
  const svgH = Math.max(boxH + 150, 400);

  return (
    <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-3 text-sm">
          <span className="font-bold text-[#00375A]">{jbTag}</span>
          <span className="text-gray-400">—</span>
          <span className="text-gray-600">{records.length} point{records.length > 1 ? 's' : ''} raccordé{records.length > 1 ? 's' : ''}</span>
        </div>
        <div className="text-xs text-gray-400">Phase 3 : Export PDF à venir</div>
      </div>

      <svg viewBox={`0 0 840 ${svgH}`} className="w-full" style={{ maxHeight: '600px' }}>
        <defs>
          <pattern id="jbgrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f5f5f5" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="840" height={svgH} fill="url(#jbgrid)" />

        {/* JB Box */}
        <rect x="50" y="30" width="380" height={boxH} fill="white" stroke="#000" strokeWidth="3" rx="4" />
        <rect x="50" y="30" width="380" height={headerH} fill="#00375A" rx="4" />
        <rect x="50" y="60" width="380" height="10" fill="#00375A" />
        <text x="240" y="56" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white">{jbTag}</text>

        {/* Column headers */}
        <text x="70" y={30 + headerH + 15} fontSize="8" fontWeight="bold" fill="#666">N°</text>
        <text x="95" y={30 + headerH + 15} fontSize="8" fontWeight="bold" fill="#666">TAG</text>
        <text x="205" y={30 + headerH + 15} fontSize="8" fontWeight="bold" fill="#666">SIGNAL</text>
        <text x="275" y={30 + headerH + 15} fontSize="8" fontWeight="bold" fill="#666">BORNES</text>
        <text x="350" y={30 + headerH + 15} fontSize="8" fontWeight="bold" fill="#666">SHIELD</text>
        <line x1="60" y1={30 + headerH + 20} x2="420" y2={30 + headerH + 20} stroke="#ddd" />

        {/* Terminal rows */}
        {records.map((r, i) => {
          const y = 30 + headerH + 25 + i * rowH;
          const termFrom = i * 2 + 1;
          const termTo = i * 2 + 2;
          const hasShield = r.isolator && r.isolator !== 'NR';

          return (
            <g key={r.id}>
              {i % 2 === 0 && <rect x="55" y={y - 5} width="370" height={rowH} fill="#F8FAFC" rx="2" />}
              <rect x="60" y={y - 2} width="360" height={rowH - 6} fill="white" stroke="#E2E8F0" rx="2" />
              <text x="72" y={y + 13} fontSize="9" fontWeight="bold" fill="#333">{i + 1}</text>
              <text x="95" y={y + 13} fontSize="9" fontWeight="bold" fill="#00375A">{r.tag}</text>
              <text x="205" y={y + 13} fontSize="9" fill="#666">{r.sig || 'N/A'}</text>
              <text x="275" y={y + 13} fontSize="9" fill="#333">{termFrom}–{termTo}</text>
              <text x="360" y={y + 13} fontSize="9" fill={hasShield ? '#0091D5' : '#ccc'}>{hasShield ? '⏚' : '—'}</text>

              {/* Connection line to instrument */}
              <line x1="430" y1={y + 8} x2="500" y2={y + 8} stroke="#000" strokeWidth="1"
                strokeDasharray={r.sig?.startsWith('DI') || r.sig?.startsWith('DO') ? '4,3' : 'none'} />

              {/* Instrument circle */}
              <circle cx="520" cy={y + 8} r="12" fill="white" stroke="#000" strokeWidth="1.5" />
              <text x="520" y={y + 11} textAnchor="middle" fontSize="6" fontWeight="bold" fill="#333">
                {r.tag.length > 8 ? r.tag.substring(0, 8) : r.tag}
              </text>

              {/* Service text */}
              <text x="545" y={y + 6} fontSize="7" fill="#333">{(r.service || '').substring(0, 30)}</text>
              <text x="545" y={y + 16} fontSize="7" fill="#999">{r.sig || ''} | {r.alim || ''}</text>
            </g>
          );
        })}

        {/* Cable Schedule */}
        <text x="50" y={boxH + 55} fontSize="11" fontWeight="bold" fill="#00375A">CABLE SCHEDULE</text>
        <line x1="50" y1={boxH + 60} x2="780" y2={boxH + 60} stroke="#00375A" strokeWidth="1.5" />

        {/* Headers */}
        {['TAG', 'CABLE TYPE', 'FROM', 'TO', 'SIGNAL', 'ALIM'].map((h, i) => (
          <text key={h} x={60 + i * 120} y={boxH + 78} fontSize="8" fontWeight="bold" fill="#666">{h}</text>
        ))}

        {records.slice(0, 8).map((r, i) => {
          const y = boxH + 90 + i * 16;
          const cable = SIG_CABLE_MAP[r.sig] || { type: 'N/A' };
          return (
            <g key={`cable-${r.id}`}>
              <text x="60" y={y} fontSize="8" fill="#333">{r.tag}</text>
              <text x="180" y={y} fontSize="8" fill="#0091D5">{cable.type}</text>
              <text x="300" y={y} fontSize="8" fill="#333">{r.tag}</text>
              <text x="420" y={y} fontSize="8" fill="#333">{jbTag}</text>
              <text x="540" y={y} fontSize="8" fill="#333">{r.sig || 'N/A'}</text>
              <text x="660" y={y} fontSize="8" fill="#333">{r.alim || 'N/A'}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB: CABLE SCHEDULE (Carnet de câbles)
// ─────────────────────────────────────────────────────────

function CableScheduleView() {
  const { records } = useApp();

  const cables = useMemo(() => {
    return records.filter(r => r.sig).map(r => {
      const spec = SIG_CABLE_MAP[r.sig] || {};
      return {
        tag: r.tag, service: r.service, sig: r.sig,
        jb_tag: r.jb_tag || '—', system: r.system || '—',
        io_address: r.io_address || '—',
        cable_type: spec.type || 'N/A',
        shield: spec.shield ? 'Oui' : 'Non',
        from: r.tag, to: r.jb_tag || r.system_cabinet || '—',
        isolator: r.isolator || 'NR',
        lightning: r.lightning || 'NR',
      };
    });
  }, [records]);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      <div className="bg-gradient-to-r from-[#00375A] to-[#0091D5] px-8 py-6">
        <h2 className="text-2xl font-bold text-white flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-lg"><Cable className="w-6 h-6" /></div>
          <span>Carnet de Câbles</span>
        </h2>
        <p className="text-[#00B4D8]/80 mt-1 text-sm">{cables.length} câble{cables.length > 1 ? 's' : ''} identifié{cables.length > 1 ? 's' : ''}</p>
      </div>

      <div className="p-6">
        {cables.length === 0 ? (
          <EmptyState icon={<Cable />} title="Aucun câble" description="Ajoutez des points avec des signaux (SIG) pour voir le carnet" />
        ) : (
          <div className="overflow-x-auto rounded-lg border-2 border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['TAG', 'SERVICE', 'SIG', 'TYPE CÂBLE', 'BLINDAGE', 'FROM', 'TO (JB)', 'ISOLATOR', 'LIGHTNING', 'I/O ADDRESS'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cables.map((c, i) => (
                  <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-2.5 text-sm font-bold text-[#00375A]">{c.tag}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 max-w-[180px] truncate">{c.service}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-700">{c.sig}</td>
                    <td className="px-4 py-2.5 text-sm text-[#0091D5] font-medium">{c.cable_type}</td>
                    <td className="px-4 py-2.5 text-sm">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.shield === 'Oui' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.shield}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{c.from}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-600">{c.to}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{c.isolator}</td>
                    <td className="px-4 py-2.5 text-sm text-gray-500">{c.lightning}</td>
                    <td className="px-4 py-2.5 text-sm font-mono text-gray-500">{c.io_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TAB NAVIGATION
// ─────────────────────────────────────────────────────────

const TABS = [
  { id: 'form', label: 'Nouveau Point', icon: Plus, shortLabel: 'Nouveau' },
  { id: 'list', label: 'Liste des Points', icon: Database, shortLabel: 'Liste' },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, shortLabel: 'Stats' },
  { id: 'loop', label: 'Schéma de Boucle', icon: GitBranch, shortLabel: 'Loop' },
  { id: 'jb', label: 'Schéma JB', icon: Box, shortLabel: 'JB' },
  { id: 'cables', label: 'Carnet de Câbles', icon: Cable, shortLabel: 'Câbles' },
];

// ─────────────────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────────────────

function BaseINSApp() {
  const [activeTab, setActiveTab] = useState('form');
  const { refData, loading: refLoading, reload: reloadRef } = useReferenceData();
  const { records, loading: recordsLoading, stats, reload: reloadRecords, insert, update, remove } = useRecords();
  const { notification, show: notify, clear: clearNotification } = useNotification();
  const { user, profile, signOut } = useAuth();

  const ctx = useMemo(() => ({
    refData, records, stats,
    notify,
    recordOps: { insert, update, remove, reload: reloadRecords },
    reloadRef,
  }), [refData, records, stats, notify, insert, update, remove, reloadRecords, reloadRef]);

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
          <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Logo Artelia cliquable → Home */}
              <div className="flex items-center space-x-4">
                <a href="#/" className="flex-shrink-0 group">
                  <img
                    src="/logo-artelia.png"
                    alt="Artelia — Retour à l'accueil"
                    className="h-9 object-contain transition-opacity group-hover:opacity-80"
                    style={{ filter: 'brightness(0) invert(1)' }}
                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                  />
                  {/* Fallback SVG */}
                  <svg style={{ display: 'none' }} width="100" height="28" viewBox="0 0 180 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="4,48 22,8 40,48" fill="none" stroke="#009BA4" strokeWidth="4.5" strokeLinejoin="round"/>
                    <line x1="11" y1="36" x2="33" y2="36" stroke="#009BA4" strokeWidth="4.5" strokeLinecap="round"/>
                    <text x="52" y="40" fontFamily="Inter,sans-serif" fontSize="28" fontWeight="700" fill="white">artelia</text>
                  </svg>
                </a>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Base de Données INS</h1>
                  <p className="text-[#00B4D8]/90 text-xs font-medium mt-0.5">
                    Gestion Instrumentation & Câblage · GS RC INS 107
                  </p>
                </div>
              </div>

              {/* Droite : statut BDD + user + refresh */}
              <div className="flex items-center gap-3">
                {/* Compteur points */}
                <div className="hidden md:flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${refLoading || recordsLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                  <span className="text-white text-sm font-medium">{records.length} points</span>
                </div>

                {/* Utilisateur connecté */}
                {user && (
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(0,180,216,0.15)', color: '#00B4D8', border: '1px solid rgba(0,180,216,0.3)' }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8] animate-pulse" />
                    <span>{profile?.full_name || user.email?.split('@')[0]}</span>
                  </div>
                )}

                {/* Refresh */}
                <button onClick={() => { reloadRef(); reloadRecords(); }}
                  className="p-2 bg-white/10 backdrop-blur-sm rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-all"
                  title="Rafraîchir">
                  <RefreshCw className="w-4 h-4" />
                </button>

                {/* Déconnexion */}
                {user && (
                  <button onClick={signOut}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/10 transition-all"
                    title="Se déconnecter">
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Lien retour home (mobile) */}
                <a href="#/" className="md:hidden p-2 bg-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all" title="Accueil">
                  <Home className="w-4 h-4" />
                </a>
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
          {activeTab === 'list' && <ListView />}
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'loop' && <LoopDiagramView />}
          {activeTab === 'jb' && <JBDiagramView />}
          {activeTab === 'cables' && <CableScheduleView />}
        </main>

        {/* ── FOOTER ── */}
        <footer className="mt-12 border-t border-gray-200 py-6 text-center text-sm text-gray-400">
          <p>INS Database v2.0 — Artelia Engineering • Standard GS RC INS 107</p>
          <p className="mt-1 text-xs">Phases : ✅ 1-Refactoring | ⏳ 2-Schema complet | ⏳ 3-PDF/DXF | ⏳ 4-Auto-fill+ | ⏳ 5-Analytics+ | ⏳ 6-Import/Batch</p>
        </footer>
      </div>
    </AppContext.Provider>
  );
}

export default BaseINSApp;