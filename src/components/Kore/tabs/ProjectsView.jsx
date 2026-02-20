// ═══════════════════════════════════════════════════════════════════════════
// KORE — ProjectsView
// Page d'accueil : liste des projets + création
// Affiché quand aucun projet n'est sélectionné
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { FolderOpen, Plus, FileText, Users, Calendar, ArrowRight, X } from 'lucide-react';
import { KORE_ROLES } from '../../../constants/Kore/roles';

// ── Modale création projet ───────────────────────────────────────────────
function CreateProjectModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', projectNumber: '', description: '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    await onSave(form);
    setLoading(false);
    onClose();
  };

  const field = (label, key, placeholder, required = false) => (
    <div>
      <label className="block text-sm font-semibold text-[#003D5C] mb-1.5">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="text"
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#009BA4] focus:outline-none text-sm"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#003D5C] text-lg">Nouveau projet</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {field('Nom du projet', 'name', 'ex: Modernisation Unité 12', true)}
          {field('N° Affaire', 'projectNumber', 'ex: HTL001')}
          <div>
            <label className="block text-sm font-semibold text-[#003D5C] mb-1.5">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Description optionnelle..."
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-[#009BA4] focus:outline-none text-sm resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#003D5C] text-white hover:bg-[#002A42] transition-colors disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer le projet'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Card projet ──────────────────────────────────────────────────────────
function ProjectCard({ project, onSelect, myRole }) {
  const docCount    = project.kore_documents?.[0]?.count || 0;
  const memberCount = project.kore_project_members?.length || 0;
  const date        = new Date(project.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <button
      onClick={() => onSelect(project)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#009BA4] hover:shadow-md transition-all group"
    >
      {/* Header card */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#003D5C]/8 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-[#003D5C]" />
          </div>
          <div>
            <p className="font-bold text-[#003D5C] text-sm leading-tight">{project.name}</p>
            {project.project_number && (
              <p className="text-xs font-mono text-gray-400 mt-0.5">{project.project_number}</p>
            )}
          </div>
        </div>
        {myRole && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${KORE_ROLES[myRole]?.color}`}>
            {KORE_ROLES[myRole]?.label}
          </span>
        )}
      </div>

      {project.description && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <FileText className="w-3.5 h-3.5" />
          {docCount} document{docCount > 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3.5 h-3.5" />
          {memberCount} membre{memberCount > 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1 ml-auto">
          <Calendar className="w-3.5 h-3.5" />
          {date}
        </span>
      </div>

      {/* Hover CTA */}
      <div className="mt-3 flex items-center justify-end text-xs font-semibold text-[#009BA4] opacity-0 group-hover:opacity-100 transition-opacity">
        Ouvrir le projet <ArrowRight className="w-3.5 h-3.5 ml-1" />
      </div>
    </button>
  );
}

// ── Composant principal ──────────────────────────────────────────────────
export function ProjectsView({ projects, loading, onSelectProject, onCreateProject }) {
  const [showCreate, setShowCreate] = useState(false);

  const handleCreate = async (form) => {
    await onCreateProject(form);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-6 h-6 border-2 border-[#009BA4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Header page */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#003D5C]">Mes projets</h1>
          <p className="text-gray-500 text-sm mt-1">
            {projects.length > 0
              ? `${projects.length} projet${projects.length > 1 ? 's' : ''} accessible${projects.length > 1 ? 's' : ''}`
              : 'Créez votre premier projet pour commencer'
            }
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#003D5C] hover:bg-[#002A42] text-white text-sm font-semibold rounded-xl transition-all"
        >
          <Plus className="w-4 h-4" />
          Nouveau projet
        </button>
      </div>

      {/* Grille projets */}
      {projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <FolderOpen className="w-12 h-12 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-semibold text-lg">Aucun projet</p>
          <p className="text-gray-400 text-sm mt-2 mb-6">
            Créez un projet pour commencer à gérer vos documents
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 bg-[#003D5C] text-white text-sm font-semibold rounded-xl hover:bg-[#002A42] transition-all"
          >
            Créer mon premier projet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(p => {
            const myMembership = p.kore_project_members?.[0];
            return (
              <ProjectCard
                key={p.id}
                project={p}
                myRole={myMembership?.role}
                onSelect={onSelectProject}
              />
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onSave={handleCreate}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
