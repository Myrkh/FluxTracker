# 🚀 FluxTracker

**Plateforme intégrée de gestion d'instrumentation, câblage et projets d'ingénierie**

FluxTracker est une application full-stack moderne pour gérer les bases de données techniques d'instrumentation (INS) et les projets d'ingénierie, avec export Excel, schémas SVG et tableaux de bord analytiques.

---

## 📋 Modules principaux

### 🔌 **BaseINS** — Gestion Base de Données Instrumentation

Gestion complète de points d'instrumentation et de câblage selon standard **Artelia GS RC INS 107**.

**Fonctionnalités :**
- ✅ **Formulaire intelligent** : auto-complétion des signaux, alimentation, isolateurs basée sur TAG/FONCTION
- ✅ **Gestion CRUD** : ajout, modification, suppression, rechercheet filtrage de points INS
- ✅ **Export Excel** : génération de carnets de câbles avec spécifications techniques
- ✅ **Schémas SVG** : visualisation des **boucles de mesure** et **boîtes de jonction**
- ✅ **Dashboard analytique** : statistiques par type de boucle (BPCS/SIS/MAINT), signaux, systèmes
- ✅ **Import en masse** : chargement d'Excel pour injecter battches de points
- ✅ **Carnet de Câbles** : table interactive des spécifications de câblage

**Données gérées :**
- TAG, SERVICE, FONCTION, SOUS-FONCTION
- LOCALISATION, TYPE DE BOUCLE (BPCS/SIS/MAINT), SYSTÈME
- SIGNAL (AI/DI/AO/DO), ALIMENTATION, ISOLATEUR, PROTECTION FOUDRE
- ARMOIRE, RACK, SLOT, I/O ADDRESS
- BOÎTE DE JONCTION, PLANS, OBSERVATIONS

---

### 🗂️ **HorizonApp** — Gestion de Projets

Interface de gestion de projets avec collaboration en temps réel, authentification, et analytique.

**Fonctionnalités :**
- ✅ **Authentification** : sign-in/sign-up sécurisé via Supabase Auth
- ✅ **Tableau de bord** : vue d'ensemble des projets actifs, statistiques
- ✅ **Gestion projets** : créer, éditer, supprimer, archiver
- ✅ **Réaltime** : synchronisation bidirectionnelle des données
- ✅ **Paramètres** : profil utilisateur, préférences, gestion équipe
- ✅ **Export** : génération rapports PDF/Excel

---

## 🏗️ Architecture & Structure

### Arborescence modulaire

```
src/
├── components/
│   ├── AuthGate.jsx                # Wrapper auth (protection routes)
│   ├── OmniLink/                   # Ancien composant omnilink (import)
│   │   └── ImportView.jsx
│   │
│   ├── BaseINS/
│   │   ├── common/                 # Composants UI réutilisables
│   │   │   ├── NotificationToast.jsx
│   │   │   ├── Section.jsx
│   │   │   ├── FormField.jsx
│   │   │   ├── StatCard.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   └── index.js
│   │   │
│   │   └── tabs/                   # Vues/écrans métier
│   │       ├── FormView.jsx        # Création nouveau point INS
│   │       ├── ListView.jsx        # Liste points, recherche, filtrage
│   │       ├── DashboardView.jsx   # Analytics & statistiques
│   │       ├── CableScheduleView.jsx
│   │       ├── LoopDiagramView/
│   │       │   ├── LoopDiagramView.jsx    # Sélecteur TAG
│   │       │   └── LoopDiagramSVG.jsx     # SVG boucle
│   │       ├── JBDiagramView/
│   │       │   ├── JBDiagramView.jsx      # Sélecteur JB
│   │       │   └── JBDiagramSVG.jsx       # SVG jonction
│   │       └── index.js
│   │
│   └── HorizonApp/
│       ├── common/
│       │   ├── Header.jsx
│       │   ├── NotificationToast.jsx
│       │   └── index.js
│       └── tabs/
│           ├── DashboardView.jsx
│           ├── ProjectsView.jsx
│           ├── SettingsView.jsx
│           └── index.js
│
├── context/
│   ├── BaseINS/
│   │   ├── AppContext.jsx
│   │   └── index.js
│   └── HorizonApp/
│       ├── AppContext.jsx
│       └── index.js
│
├── hooks/
│   ├── BaseINS/
│   │   ├── useReferenceData.js     # Chargement données ref Supabase
│   │   ├── useRecords.js           # CRUD points + stats
│   │   ├── useNotification.js      # Toast notifications
│   │   └── index.js
│   └── HorizonApp/
│       ├── useAuthState.js
│       ├── useProjects.js
│       ├── useRealtime.js
│       └── index.js
│
├── services/
│   ├── BaseINS/
│   │   ├── AutoFillService.js      # Logique suggestions auto (TAG→FONCTION→SIG)
│   │   ├── ExportService.js        # Export Excel & transformations
│   │   └── index.js
│   └── HorizonApp/
│       ├── ApiService.js
│       ├── ExportService.js
│       └── index.js
│
├── constants/
│   ├── BaseINS/
│   │   ├── mappings.js             # TAG_FUNCTION_MAP, FUNCTION_SIG_MAP, etc.
│   │   ├── colors.js               # Palette Artelia
│   │   ├── selectStyles.js         # Styles react-select custom
│   │   ├── cables.js               # SIG_CABLE_MAP (spécifications)
│   │   ├── tabs.js                 # Config onglets
│   │   └── index.js
│   └── HorizonApp/
│       ├── uiConfig.js
│       ├── mappings.js
│       └── index.js
│
├── lib/
│   ├── supabase.js                 # Client Supabase
│   ├── horizonData.js              # Hook auth globale
│   └── utils.js
│
├── page/
│   ├── BaseINS.jsx                 # 🎯 Orchestrateur BaseINS (imports + router)
│   ├── HorizonApp.jsx              # 🎯 Orchestrateur HorizonApp (imports + router)
│   ├── HomePage.jsx                # Landing page
│   ├── KoreDoc.jsx                 # Documentation
│   └── BaseINS.jsx (legacy)        # À supprimer après migration
│
├── App.jsx                          # Point d'entrée (router principal)
├── main.jsx
├── index.css                        # Styles globaux
└── theme/
    └── artelia.js                   # Design tokens Artelia
```

### Stratégie de découpe

Chaque **section logique** (délimitée par `// ── ROLE ──`) devient un fichier spécialisé :

1. **constants/** → données statiques (mappings, couleurs, config)
2. **context/** → gestion état global du module
3. **hooks/** → logique métier, requêtes DB, états réactifs
4. **services/** → algorithmes, transformations, exports
5. **components/common/** → UI réutilisable (Sections, FormFields, Cards)
6. **components/tabs/** → écrans/pages métier (FormView, ListView, etc.)
7. **page/*.jsx** → orchestrateur final (imports + layout)

**Avantages :**
- ✅ Maintenabilité : responsabilité unique par fichier
- ✅ Testabilité : services et hooks isolés
- ✅ Scalabilité : ajouter une vue = créer 1 fichier, pas modifier 1700 lignes
- ✅ Réutilisabilité : composants et services partagés
- ✅ Performance : opportunités de code splitting et lazy loading

---

## 🛠️ Stack technologique

| Couche | Technologie |
|--------|-------------|
| **Frontend** | React 18 + Vite |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |
| **Styles** | TailwindCSS + Custom CSS |
| **Graphiques** | Recharts (Bar, Pie, Line, Area) |
| **Formulaires** | React Select (custom styled) |
| **Exports** | ExcelJS |
| **Icônes** | Lucide React |
| **Routing** | Browser History Hash |

---

## 📦 Installation & Setup

### Prérequis

- Node.js ≥ 18
- npm ou yarn
- Compte Supabase (production) ou développement local

### 1. Cloner & dépendances

```bash
git clone https://github.com/Myrkh/FluxTracker.git
cd FluxTracker
npm install
```

### 2. Configurer Supabase

Créer un fichier `.env.local` aquot racine :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Clés disponibles dans : Supabase Dashboard → Settings → API

### 3. Démarrer dev

```bash
npm run dev
```

App accessible à `http://localhost:5173`

### 4. Build production

```bash
npm run build
```

Artefacts dans `dist/`

---

## 🚀 Démarrage rapide

### BaseINS

1. Navigate to **Nouveau Point**
2. Remplir TAG (ex: `FT-1001`)
3. Taper SERVICE (ex: `P108 REFOULEMENT`)
4. Sélectionner FONCTION → auto-suggestions pour SIG, ISOLATEUR, CABLEMENT
5. **Enregistrer** → apparaît dans Liste
6. Vue **Schéma de Boucle** → générer SVG loop diagram
7. Vue **Carnet de Câbles** → table complète avec spécifications

### HorizonApp

1. Navigate to **Horizon**
2. Sign-in ou Create Account
3. Dashboard → voir projets actifs
4. **+ New Project** → Create
5. Invite team members
6. Collaborate in realtime

---

## 📊 Phases de développement

```
✅ Phase 1 : Refactoring modulaire
   └─ Extraire BaseINS & HorizonApp en composants séparés

⏳ Phase 2 : Schéma complet
   └─ Tous les champs, validation, tests unitaires

⏳ Phase 3 : Export PDF/DXF
   └─ Générer loop diagrams en PDF, dessins techniques en DXF

⏳ Phase 4 : Auto-fill avancé
   └─ Suggestions ML basées sur historique, predictions standards

⏳ Phase 5 : Analytics+
   └─ Dashboards avancés, trending, alerts KPI

⏳ Phase 6 : Import/Batch
   └─ Batch operations, multi-upload, reconciliation
```

---

## 🔐 Authentification & Sécurité

- **Supabase Auth** : Magic Links, OAuth, SSO-ready
- **Row Level Security (RLS)** : données isolées par utilisateur
- **CORS** : configuré pour domaines autorisés
- **API Keys** : séparation anon/service_role

---

## 🤝 Contribution

1. Fork le repo
2. Créer branche feature (`git checkout -b feature/amazing-thing`)
3. Commit & push
4. Open Pull Request

### Standards de code

- **Naming** : camelCase pour variables/fonctions, PascalCase pour composants
- **Components** : découpe logique, un fichier par component (ou dossier si + de 2 fichiers)
- **Styles** : TailwindCSS, pas de CSS modules à moins de nécessité
- **Imports** : organiser par: React → libs → projet (constants/context/hooks/components)

---

## 📄 Licence

Propriétaire © 2025 Artelia Engineering. Voir [`LICENSE`](./LICENSE)

---

## 📞 Support & Documentation

- **Spécification INS** : voir [`EXCEL_IMPORT_FORMAT.md`](./EXCEL_IMPORT_FORMAT.md)
- **Artelia Standard** : GS RC INS 107 (Gestion Instrumentation)
- **Issues** : GitHub Issues
- **Wiki** : À venir

---

## 🎨 Design System

### Couleurs Artelia

```javascript
{
  primary: '#00375A',      // Bleu navy
  light: '#0091D5',        // Bleu vif
  accent: '#00B4D8',       // Cyan
  success: '#10B981',      // Vert
  warning: '#F59E0B',      // Ambre
  danger: '#EF4444',       // Rouge
}
```

### Typographie

- **Headings** : Inter Bold
- **Body** : Inter Regular
- **Mono** : SF Mono (code)

---

**Made with ❤️ by Artelia Engineering**
