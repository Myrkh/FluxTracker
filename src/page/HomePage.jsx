import React, { useState } from 'react';
import { ARTELIA_BRAND } from '../theme/artelia';
import { ExternalLink, ChevronRight, BarChart3, User, Database, Users, Globe, ListTodo, Linkedin, Mail, Phone, MapPin, Zap, Shield, TrendingUp, ScanEye, Cpu, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../lib/horizonData';

// ─── CARDS APPLICATIONS ──────────────────────────────────────────────────────
const APP_CARDS = [
  {
    id: 'horizon',
    name: 'Oryzon',
    subtitle: 'Hub de Pilotage Projet Artelia',
    description: 'Suivi structuré des tâches projet · Objet → Action → Responsable · Export PDF pro',
    icon: ListTodo,
    href: '#/horizon',
    color: '#009BA4',
    badge: 'Disponible',
    badgeColor: '#2ECC71',
    features: ['Kanban · Liste · Stats', 'Priorités & Statuts', 'Export PDF & Email'],
  },
  {
    id: 'baseins',
    name: 'OmniLink',
    subtitle: 'Base de Données Projet',
    description: 'Gestion des points de mesure, câblage, schémas de boucle et carnet de câbles. Standard GS RC INS 107.',
    icon: Database,
    href: '#/baseins',
    color: '#0091D5',
    badge: 'Disponible',
    badgeColor: '#2ECC71',
    features: ['Points de mesure & TAGs', 'Carnet de câbles auto', 'Dashboard & exports Excel'],
  },
  {
    id: 'doctracker',
    name: 'Argos',
    subtitle: 'Tracker projet',
    description: 'Recevoir rapidement une notification de modification/création documents.',
    icon: ScanEye,
    href: '#',
    color: '#007A82',
    badge: 'Bientôt',
    badgeColor: '#F39C12',
    features: ['TrackerDoc', 'Notification direct', 'Qui ? Quoi ?'],
    locked: true,
  },
  {
    id: 'basedoc',
    name: 'KORE',
    subtitle: 'Gestion Documentaire Projet',
    description: 'Codification HXAQ023 · N° uniques auto-générés · Révisions IFA/IFC/ASB · Registre de diffusion · Détection doublons intelligente.',
    icon: Cpu,
    href: '#/kore',
    color: '#003D5C',
    badge: 'Disponible',
    badgeColor: '#2ECC71',
    features: ['N° auto selon HXAQ023', 'Révisions & statuts', 'Détection doublons IA'],
  },
];

// ─── LIENS FOOTER ─────────────────────────────────────────────────────────────
const FOOTER_LINKS = {
  'Sites Artelia': [
    { label: 'Artelia Group', href: 'https://www.arteliagroup.com', ext: true },
    { label: 'Artelia France', href: 'https://www.artelia.fr', ext: true },
    { label: 'Artelia Canada', href: 'https://www.fnx-innov.com', ext: true },
  ],
  'Outils Pro': [
    { label: 'SharePoint', href: '#', ext: false },
    { label: 'Teams', href: '#', ext: false },
    { label: 'PowerBI', href: 'https://app.powerbi.com', ext: true },
  ],
  'Ressources': [
    { label: 'Portail RH', href: '#', ext: false },
    { label: 'Formation e-learning', href: '#', ext: false },
    { label: 'Support IT', href: '#', ext: false },
  ],
};

// ─── LOGO SVG ARTELIA ─────────────────────────────────────────────────────────
const ArteliaLogo = ({ size = 48, className = '' }) => (
  <img
                  src="/logo-artelia.png"
                  alt="Artelia"
                  className="h-8 w-auto object-contain"
                  style={{ filter: 'brightness(0) invert(1)' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
);

// ─── APP CARD ─────────────────────────────────────────────────────────────────
const AppCard = ({ card }) => {
  const Icon = card.icon;
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={card.href}
      onClick={card.locked ? (e) => e.preventDefault() : undefined}
      className={`group relative flex flex-col rounded-2xl border-2 transition-all duration-300 overflow-hidden
        ${card.locked
          ? 'border-gray-200 cursor-not-allowed opacity-70'
          : 'border-transparent hover:border-[#009BA4] hover:shadow-2xl cursor-pointer'
        }
      `}
      style={{ background: '#fff' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top color stripe */}
      <div
        className="h-1.5 w-full transition-all duration-300"
        style={{ background: card.color, opacity: hovered && !card.locked ? 1 : 0.7 }}
      />

      <div className="flex flex-col flex-1 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
            style={{ background: card.color + '18' }}
          >
            <Icon className="w-6 h-6" style={{ color: card.color }} />
          </div>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: card.badgeColor + '20', color: card.badgeColor }}
          >
            {card.badge}
          </span>
        </div>

        {/* Title */}
        <h3
          className="text-xl font-bold mb-0.5 transition-colors duration-200"
          style={{ color: hovered && !card.locked ? card.color : '#003D5C' }}
        >
          {card.name}
        </h3>
        <p className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wide">{card.subtitle}</p>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-4 leading-relaxed flex-1">{card.description}</p>

        {/* Features */}
        <ul className="space-y-1.5 mb-5">
          {card.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: card.color }} />
              {f}
            </li>
          ))}
        </ul>

        {/* CTA */}
        <div
          className="flex items-center gap-1.5 text-sm font-semibold transition-colors duration-200"
          style={{ color: card.locked ? '#aaa' : card.color }}
        >
          {card.locked ? 'En développement' : 'Accéder'}
          {!card.locked && (
            <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          )}
        </div>
      </div>
    </a>
  );
};

// ─── HOMEPAGE ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user, profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F4F7F8', fontFamily: "'Inter', sans-serif" }}>

      {/* ── HEADER / HERO ────────────────────────────────────────────────── */}
      <header className="relative overflow-hidden" style={{ background: '#003D5C' }}>

        {/* Background pattern géométrique léger */}
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Accent teal wave bottom */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full">
            <path d="M0,60 L0,30 Q360,0 720,30 Q1080,60 1440,20 L1440,60 Z" fill="#009BA4" opacity="0.15" />
            <path d="M0,60 L0,45 Q360,20 720,45 Q1080,60 1440,38 L1440,60 Z" fill="#F4F7F8" />
          </svg>
        </div>

        {/* ── Barre user top-right ── */}
        <div className="absolute top-4 right-6 z-10 flex items-center gap-2">
          {user ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(0,155,164,0.2)', color: '#33B5BC', border: '1px solid rgba(0,155,164,0.35)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#009BA4] animate-pulse" />
                <User className="w-3 h-3" />
                <span className="hidden sm:inline max-w-[120px] truncate">{profile?.full_name || user.email?.split('@')[0]}</span>
              </div>
              <button onClick={signOut}
                className="px-2.5 py-1.5 rounded-full text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1">
                <LogOut className="w-3 h-3" />
              </button>
            </>
          ) : (
            <a href="#/horizon"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{ background: 'rgba(0,155,164,0.15)', color: '#8BBCC8', border: '1px solid rgba(0,155,164,0.25)' }}>
              <LogIn className="w-3 h-3" />
              <span>Connexion</span>
            </a>
          )}
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-12 md:py-16">
          {/* Logo Artelia */}
          <div className="flex flex-col items-center text-center">
            {/* Logo Artelia — remplacez logo-artelia.png dans /public */}
            <div className="mb-6">
              <img
                src="/logo-artelia.png"
                alt="Artelia"
                className="h-16 md:h-20 mx-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
                onError={(e) => {
                  // Fallback SVG triangle si le PNG n'est pas encore en place
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              {/* Fallback SVG — disparaît quand logo-artelia.png est présent */}
              <svg style={{ display: 'none' }} width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto">
                <polygon points="28,4 52,52 4,52" fill="none" stroke="#009BA4" strokeWidth="3.5" strokeLinejoin="round"/>
                <line x1="16" y1="40" x2="40" y2="40" stroke="#009BA4" strokeWidth="3.5" strokeLinecap="round"/>
              </svg>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="h-px w-8" style={{ background: '#009BA4' }} />
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#009BA4' }}>
                Passion & Solutions
              </span>
              <div className="h-px w-8" style={{ background: '#009BA4' }} />
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-3 leading-tight">
              Vos outils projet,<br />
              <span style={{ color: '#009BA4' }}>au même endroit.</span>
            </h1>
            <p className="text-base md:text-lg max-w-xl leading-relaxed" style={{ color: '#8BBCC8' }}>
              Plateforme interne Artelia — gestion de projet, ressources & outils métiers
            </p>
          </div>
        </div>
      </header>

      {/* ── PILLS STATS ───────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 -mt-1 mb-8 w-full">
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { icon: Users, label: '8 600 collaborateurs', color: '#009BA4' },
            { icon: Globe, label: '+40 pays', color: '#003D5C' },
            { icon: Shield, label: 'ISO 27001 certifié', color: '#2ECC71' },
            { icon: TrendingUp, label: '934M€ CA 2022', color: '#F39C12' },
          ].map(({ icon: Icon, label, color }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-sm text-sm font-medium border border-gray-100"
            >
              <Icon className="w-4 h-4" style={{ color }} />
              <span style={{ color: '#2C3E45' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── APPS SECTION ──────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pb-16 w-full">

        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: '#003D5C' }}>
            Applications disponibles
          </h2>
          <p className="text-gray-500 text-sm">Cliquez sur une application pour y accéder</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {APP_CARDS.map((card) => (
            <AppCard key={card.id} card={card} />
          ))}
        </div>

           
      </main>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer style={{ background: '#003D5C' }}>
        {/* Top accent line */}
        <div className="h-1" style={{ background: '#009BA4' }} />

        <div className="max-w-6xl mx-auto px-6 py-12">
          {/* Links grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            {/* Brand bloc */}
            <div className="col-span-2 md:col-span-1">
              <ArteliaLogo size={32} className="mb-4 brightness-0 invert" />
              <p className="text-xs leading-relaxed mb-4" style={{ color: '#8BBCC8' }}>
                Groupe international d'ingénierie, de conseil et de management de projets dans les domaines
                de la mobilité, de l'eau, de l'énergie et du bâtiment.
              </p>
              <div className="flex gap-3">
                <a
                  href={ARTELIA_BRAND.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
                  style={{ background: '#005078' }}
                >
                  <Linkedin className="w-4 h-4 text-white" />
                </a>
                <a
                  href={ARTELIA_BRAND.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-white/20"
                  style={{ background: '#005078' }}
                >
                  <Globe className="w-4 h-4 text-white" />
                </a>
              </div>
            </div>

            {/* Links */}
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category}>
                <h4
                  className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: '#009BA4' }}
                >
                  {category}
                </h4>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        target={link.ext ? '_blank' : '_self'}
                        rel={link.ext ? 'noopener noreferrer' : undefined}
                        className="flex items-center gap-1.5 text-sm transition-colors hover:text-white"
                        style={{ color: '#8BBCC8' }}
                      >
                        {link.label}
                        {link.ext && <ExternalLink className="w-3 h-3 opacity-60" />}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: '#8BBCC8' }}>
              © {new Date().getFullYear()} Artelia Group · Hub Numérique Interne · Usage strictement interne
            </p>
            <div className="flex items-center gap-4 text-xs" style={{ color: '#8BBCC8' }}>
              <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-white transition-colors">CGU</a>
              <span className="flex items-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: '#2ECC71' }}
                />
                Tous les services opérationnels
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}