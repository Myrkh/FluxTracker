import { LayoutDashboard, Layers, GitBranch, Cable } from 'lucide-react';

/**
 * Navigation principale OmniLink — 4 tabs (refonte UX Less is More)
 * - Points INS : Form + Import + Liste (sub-nav interne)
 * - Dashboard  : Stats globales
 * - Schémas    : Loop Diagrams + JB Diagrams (sub-nav interne)
 * - Câblage    : Carnets de câbles Unité / Local / Multi
 */
export const TABS = [
  {
    id: 'points',
    label: 'Points INS',
    shortLabel: 'Points',
    icon: Layers,
    subTabs: [
      { id: 'form',   label: 'Nouveau',  shortLabel: 'Nouveau' },
      { id: 'import', label: 'Import',   shortLabel: 'Import'  },
      { id: 'list',   label: 'Liste',    shortLabel: 'Liste'   },
    ],
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    shortLabel: 'Stats',
    icon: LayoutDashboard,
    subTabs: [],
  },
  {
    id: 'schemas',
    label: 'Schémas',
    shortLabel: 'Schémas',
    icon: GitBranch,
    subTabs: [
      { id: 'loop', label: 'Schémas de Boucle', shortLabel: 'Boucle' },
      { id: 'jb',   label: 'Schémas JB',        shortLabel: 'JB'     },
    ],
  },
  {
    id: 'cables',
    label: 'Câblage',
    shortLabel: 'Câbles',
    icon: Cable,
    subTabs: [],
  },
];