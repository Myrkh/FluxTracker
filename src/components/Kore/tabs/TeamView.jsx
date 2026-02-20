// ═══════════════════════════════════════════════════════════════════════════
// KORE — TeamView
// Gestion de l'équipe projet : membres, rôles, invitations
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Users, UserPlus, Crown, Trash2, ChevronDown, Mail, Shield, X } from 'lucide-react';
import { KORE_ROLES, ROLE_OPTIONS, can } from '../../../constants/Kore/roles';

// ── Avatar initiales ─────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }) {
  const initials = name
    ?.split(' ').filter(Boolean).slice(0, 2)
    .map(w => w[0].toUpperCase()).join('') || '?';
  const sz = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${sz} rounded-full bg-[#003D5C]/10 text-[#003D5C] font-bold flex items-center justify-center flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ── Badge rôle ───────────────────────────────────────────────────────────
function RoleBadge({ role }) {
  const cfg = KORE_ROLES[role];
  if (!cfg) return null;
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// ── Dropdown rôle (modifiable si Chef de Projet) ─────────────────────────
function RoleDropdown({ currentRole, memberId, isOwner, canManage, onUpdate }) {
  const [open, setOpen] = useState(false);

  if (!canManage || isOwner) return <RoleBadge role={currentRole} />;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200 hover:border-[#009BA4] transition-colors"
      >
        <span className={`inline-block w-2 h-2 rounded-full ${KORE_ROLES[currentRole]?.color?.split(' ')[0]}`} />
        {KORE_ROLES[currentRole]?.label}
        <ChevronDown className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-7 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1 overflow-hidden">
          {ROLE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onUpdate(memberId, opt.value); setOpen(false); }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-50 transition-colors
                ${opt.value === currentRole ? 'font-bold text-[#003D5C]' : 'text-gray-600'}`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${KORE_ROLES[opt.value]?.color?.split(' ')[0]}`} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Modale invitation ────────────────────────────────────────────────────
function InviteModal({ onInvite, onClose }) {
  const [email, setEmail]   = useState('');
  const [role,  setRole]    = useState('INGENIEUR');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      setError('Adresse email invalide');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await onInvite(email.trim(), role);
    setLoading(false);
    if (err) {
      setError(err.message || 'Erreur lors de l\'invitation');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-[#003D5C] text-lg flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#009BA4]" />
            Inviter un membre
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#003D5C] mb-1.5">
              Adresse email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="prenom.nom@artelia.fr"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#009BA4] focus:outline-none text-sm"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#003D5C] mb-1.5">Rôle</label>
            <div className="grid grid-cols-1 gap-2">
              {ROLE_OPTIONS.map(opt => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all
                    ${role === opt.value
                      ? 'border-[#009BA4] bg-teal-50'
                      : 'border-gray-100 hover:border-gray-200'
                    }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={opt.value}
                    checked={role === opt.value}
                    onChange={() => setRole(opt.value)}
                    className="sr-only"
                  />
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${KORE_ROLES[opt.value]?.color?.split(' ')[0]}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-700">{opt.label}</p>
                    <p className="text-xs text-gray-400">
                      {opt.value === 'CHEF_PROJET'  && 'Accès total, gestion équipe'}
                      {opt.value === 'DOC_CONTROL'  && 'Registre, transmissions BT'}
                      {opt.value === 'INGENIEUR'    && 'Création et modification de documents'}
                      {opt.value === 'VERIFICATEUR' && 'Signatures uniquement'}
                      {opt.value === 'LECTEUR'      && 'Consultation sans modification'}
                    </p>
                  </div>
                  {role === opt.value && (
                    <Shield className="w-4 h-4 text-[#009BA4] ml-auto flex-shrink-0" />
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!email.trim() || loading}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#003D5C] text-white hover:bg-[#002A42] transition-all disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Inviter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ──────────────────────────────────────────────────
export function TeamView({ members, myRole, activeProject, onInvite, onUpdateRole, onRemove, notify }) {
  const [showInvite, setShowInvite] = useState(false);
  const canManage = can(myRole, 'team:manage');

  const handleInvite = async (email, role) => {
    const { error } = await onInvite(activeProject.id, email, role);
    if (!error) notify?.(`Invitation envoyée à ${email}`);
    return { error };
  };

  const handleRemove = async (member) => {
    if (!confirm(`Retirer ${member.profiles?.full_name || member.profiles?.email} du projet ?`)) return;
    const { error } = await onRemove(member.id);
    if (!error) notify?.('Membre retiré du projet');
    else notify?.('Erreur lors de la suppression', 'error');
  };

  // Trier : Chef en premier
  const sortedMembers = [...members].sort((a, b) => {
    const order = { CHEF_PROJET: 0, DOC_CONTROL: 1, INGENIEUR: 2, VERIFICATEUR: 3, LECTEUR: 4 };
    return (order[a.role] ?? 99) - (order[b.role] ?? 99);
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#003D5C] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#009BA4]" />
            Équipe projet
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {members.length} membre{members.length > 1 ? 's' : ''} · {activeProject?.name}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#003D5C] hover:bg-[#002A42] text-white text-sm font-semibold rounded-xl transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Inviter
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {sortedMembers.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Aucun membre</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedMembers.map(member => {
              const profile   = member.profiles;
              const name      = profile?.full_name || profile?.email || 'Utilisateur inconnu';
              const email     = profile?.email || '';
              const isOwner   = member.role === 'CHEF_PROJET' &&
                                activeProject?.created_by === member.user_id;
              const isMe      = member.user_id === member.myUserId; // passé si nécessaire

              return (
                <div key={member.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <Avatar name={name} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-700 truncate">{name}</p>
                      {isOwner && (
                        <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="Créateur du projet" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3" />{email}
                    </p>
                  </div>

                  <RoleDropdown
                    currentRole={member.role}
                    memberId={member.id}
                    isOwner={isOwner}
                    canManage={canManage}
                    onUpdate={onUpdateRole}
                  />

                  {canManage && !isOwner && (
                    <button
                      onClick={() => handleRemove(member)}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex-shrink-0"
                      title="Retirer du projet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Légende rôles */}
      <div className="mt-4 bg-gray-50 rounded-xl p-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Droits par rôle</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ROLE_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${KORE_ROLES[opt.value]?.color?.split(' ')[0]}`} />
              <span className="text-xs text-gray-500">{opt.label}</span>
            </div>
          ))}
        </div>
      </div>

      {showInvite && (
        <InviteModal onInvite={handleInvite} onClose={() => setShowInvite(false)} />
      )}
    </div>
  );
}
