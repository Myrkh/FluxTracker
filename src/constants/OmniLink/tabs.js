import { Plus, Database, BarChart3, GitBranch, Box, Cable, Upload } from 'lucide-react';

export const TABS = [
  { id: 'form', label: 'Nouveau Point', icon: Plus, shortLabel: 'Nouveau' },
  { id: 'import', label: 'Import Excel', icon: Upload, shortLabel: 'Import' },
  { id: 'list', label: 'Liste des Points', icon: Database, shortLabel: 'Liste' },
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, shortLabel: 'Stats' },
  { id: 'loop', label: 'Schéma de Boucle', icon: GitBranch, shortLabel: 'Loop' },
  { id: 'jb', label: 'Schéma JB', icon: Box, shortLabel: 'JB' },
  { id: 'cables', label: 'Carnet de Câbles', icon: Cable, shortLabel: 'Câbles' },
];
