// ═══════════════════════════════════════════════════════════════════════════
// KORE — Référentiels HXAQ023 Rév.10
// Single source of truth pour toute la codification documentaire Artelia
// ═══════════════════════════════════════════════════════════════════════════

export const CENTRES_PROFIT = {
  A: 'Saint-Nazaire',
  C: 'Cherbourg',
  D: 'Dunkerque',
  F: 'Maubeuge',
  G: 'Port Jérôme sur Seine',
  H: 'Le Havre',
  J: 'Pierrelatte',
  K: 'Caen',
  L: 'Lyon',
  M: 'Martigues',
  P: 'Paris',
  Q: 'Châtellerault / Le Mans',
  R: 'Rouen',
  S: 'Monthey (CH)',
  T: 'Tarbes',
  U: 'Mulhouse',
  V: 'Saint-Avold',
};

export const ANNEES = {
  E: 2018, F: 2019, G: 2020, H: 2021, I: 2022,
  J: 2023, K: 2024, L: 2025, M: 2026,
};

export const CODES_DISTINCTIFS = [
  ['T', "Tous Corps d'État"],
  ['E', 'EIA'],
  ['M', 'Mécanique'],
  ['R', 'Procédé'],
  ['I', 'Atelier'],
  ['B', 'Belgique'],
  ['C', 'Brest'],
  ['G', 'Grenoble'],
];

export const DISCIPLINES = {
  PJT: 'Général projet / Planning / Plan qualité',
  ADM: 'Administratif / Contrat',
  COS: 'Estimation budgétaire / Cost-Control',
  HSE: 'HSE / Sécurité / HAZOP',
  PRC: 'Achats / Procurement',
  CST: 'Construction / Chantier',
  COM: 'Précommissioning / Commissioning',
  RAD: 'Sûreté / Radioprotection',
  PRO: 'Procédé / Process',
  COR: 'Maîtrise de la corrosion',
  GCV: 'Génie civil / VRD / Fondations',
  STR: 'Charpente / Steel structure',
  BAT: 'Bâtiment / Architecture',
  EQC: 'Équipements Chaudronnés',
  EQM: 'Équipements Mécaniques',
  EQT: 'Équipements Thermiques',
  EQD: 'Équipements Divers',
  PIP: 'Canalisation / Tuyauterie / Pipeline',
  EIA: 'EIA (documents communs)',
  ELE: 'Électricité (tous courants)',
  ELF: 'Électricité (courants forts)',
  INS: 'Instrumentation / Télécommunications',
  AUT: 'Automatisme',
  ANA: 'Analyseurs',
  HVA: 'CVC / Ventilation / Climatisation',
  MEC: 'Mécanique (outillage / machines spéciales)',
};

export const STATUTS = {
  PRE: 'Préliminaire',
  IFR: 'Émis pour Revue / Commentaires',
  INF: 'Émis pour Information',
  IFA: 'Émis pour Approbation',
  IFI: 'Émis pour Consultation',
  IFP: 'Émis pour Achat',
  IFD: 'Émis pour Exécution',
  IFC: 'Émis pour Construction',
  ASB: 'Tel Que Construit (As Built)',
  FIN: 'Documentation Finale',
  CLD: 'Annulé',
};

export const STATUT_COLORS = {
  PRE: 'bg-gray-100 text-gray-600',
  IFR: 'bg-yellow-100 text-yellow-700',
  INF: 'bg-blue-100 text-blue-700',
  IFA: 'bg-orange-100 text-orange-700',
  IFI: 'bg-purple-100 text-purple-700',
  IFP: 'bg-pink-100 text-pink-700',
  IFD: 'bg-indigo-100 text-indigo-700',
  IFC: 'bg-green-100 text-green-700',
  ASB: 'bg-teal-100 text-teal-700',
  FIN: 'bg-emerald-100 text-emerald-700',
  CLD: 'bg-red-100 text-red-500 line-through',
};

/** Statuts considérés comme "émis" (document finalisé) */
export const STATUTS_EMIS = ['IFC', 'ASB', 'FIN'];

export const SUFFIXES = {
  '':    'Aucun suffixe',
  RQT:   'Réquisition technique',
  RQC:   'Réquisition commerciale',
  LIF:   'Liste des fournisseurs',
  TCO:   'Tableaux comparatifs',
  PID:   'Plan de circulation des Fluides (PID)',
  LPD:   'Schéma de boucle',
  WIR:   'Schémas de câblage',
  ISO:   'Isométrique',
  CAL:   'Notes de calcul',
  TNO:   'Note technique',
  MOM:   'Compte rendu de réunion',
  LST:   'Liste / Index',
  SPE:   'Spécification matériel',
  SPG:   'Spécification générale',
  DTS:   'Data-sheet',
  REP:   'Rapport / Synthèse',
  MTO:   'Métré de matériel',
  PLG:   'Planning',
  PAQ:   'Plan Qualité',
  MAN:   'Manuel opératoire',
  FOR:   'Forme / Gabarit',
  DWG:   'Plan guide',
  DWD:   'Plan de détail',
  GEA:   "Plan d'ensemble",
  SLD:   'Synoptique des liaisons',
  PFD:   'Process Flow Diagram',
  BLD:   'Block diagram',
  TYP:   'Plans et schémas type',
  REX:   "Retour d'expérience",
  MRE:   'Rapport mensuel',
  WRE:   'Rapport hebdomadaire',
};
