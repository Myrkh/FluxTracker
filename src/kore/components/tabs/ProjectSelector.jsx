// ═══════════════════════════════════════════════════════════════════════════
// KORE — ProjectSelector
// Dropdown dans le header pour switcher de projet rapidement
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, FolderOpen, Plus, Check } from 'lucide-react';
import { KORE_ROLES } from '../../constants/roles';

export function ProjectSelector({ projects, activeProject, onSelect, onCreateNew, myRole }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-sm font-medium
          ${open
            ? 'bg-[#003D5C] text-white border-[#003D5C]'
            : 'bg-white text-[#003D5C] border-gray-200 hover:border-[#009BA4]'
          }`}
      >
        <FolderOpen className="w-4 h-4 flex-shrink-0" />
        <span className="max-w-[160px] truncate">
          {activeProject ? activeProject.name : 'Sélectionner un projet'}
        </span>
        {activeProject && myRole && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${KORE_ROLES[myRole]?.color}`}>
            {KORE_ROLES[myRole]?.short}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
          {/* Header dropdown */}
          <div className="px-4 py-2.5 border-b border-gray-100">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mes projets</p>
          </div>

          {/* Liste projets */}
          <div className="max-h-64 overflow-y-auto py-1">
            {projects.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-400">Aucun projet</p>
            ) : (
              projects.map(p => {
                const role = p.kore_project_members?.find(m => m.user_id)?.role;
                const docCount = p.kore_documents?.[0]?.count || 0;
                const isActive = activeProject?.id === p.id;

                return (
                  <button
                    key={p.id}
                    onClick={() => { onSelect(p); setOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors
                      ${isActive ? 'bg-[#003D5C]/5' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-semibold truncate ${isActive ? 'text-[#003D5C]' : 'text-gray-700'}`}>
                          {p.name}
                        </p>
                        {isActive && <Check className="w-3.5 h-3.5 text-[#009BA4] flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                        {p.project_number && <span className="font-mono">{p.project_number}</span>}
                        <span>{docCount} doc{docCount > 1 ? 's' : ''}</span>
                      </p>
                    </div>
                    {role && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${KORE_ROLES[role]?.color || 'bg-gray-200 text-gray-600'}`}>
                        {KORE_ROLES[role]?.short}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer — créer projet */}
          <div className="border-t border-gray-100 p-2">
            <button
              onClick={() => { onCreateNew(); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-[#009BA4] hover:bg-teal-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau projet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
