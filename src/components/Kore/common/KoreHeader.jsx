// ═══════════════════════════════════════════════════════════════════════════
// KORE — KoreHeader
// ═══════════════════════════════════════════════════════════════════════════

import React from 'react';
import { LogOut, Home } from 'lucide-react';

export function KoreHeader({ user, profile, signOut, docsCount }) {
  return (
    <header className="bg-gradient-to-r from-[#003D5C] to-[#005078] shadow-xl">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a href="#/" className="flex-shrink-0 group">
              <img
                src="/logo-artelia.png"
                alt="Artelia"
                className="h-9 object-contain group-hover:opacity-80 transition-opacity"
                style={{ filter: 'brightness(0) invert(1)' }}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
              />
              {/* Fallback SVG logo */}
              <svg style={{ display: 'none' }} width="100" height="28" viewBox="0 0 180 56" fill="none">
                <polygon points="4,48 22,8 40,48" fill="none" stroke="#009BA4" strokeWidth="4.5" strokeLinejoin="round"/>
                <line x1="11" y1="36" x2="33" y2="36" stroke="#009BA4" strokeWidth="4.5" strokeLinecap="round"/>
                <text x="52" y="40" fontFamily="Inter,sans-serif" fontSize="28" fontWeight="700" fill="white">artelia</text>
              </svg>
            </a>

            <div className="w-px h-8 bg-white/20" />

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">KORE</h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#009BA4] text-white font-semibold">
                  HXAQ023
                </span>
              </div>
              <p className="text-xs text-[#8BBCC8]">
                Gestion Documentaire Projet · {docsCount} document{docsCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <div
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{ background: 'rgba(0,155,164,0.15)', color: '#009BA4', border: '1px solid rgba(0,155,164,0.3)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#009BA4] animate-pulse" />
                <span>{profile?.full_name || user.email?.split('@')[0]}</span>
              </div>
            )}
            {user && (
              <button
                onClick={signOut}
                className="p-2 bg-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all"
                title="Déconnecter"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
            <a
              href="#/"
              className="p-2 bg-white/10 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-all"
              title="Accueil Hub"
            >
              <Home className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
