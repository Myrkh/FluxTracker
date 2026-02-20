// ═══════════════════════════════════════════════════════════════════════════
// KORE — useProjects Hook
// Gestion des projets et membres
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export function useProjects(userId) {
  const [projects,       setProjects]       = useState([]);
  const [activeProject,  setActiveProject]  = useState(null);
  const [members,        setMembers]        = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [myRole,         setMyRole]         = useState(null);

  // ── Charger les projets de l'utilisateur ──────────────────────────────
  const loadProjects = useCallback(async () => {
    if (!userId) { setProjects([]); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kore_projects')
        .select(`
          *,
          kore_project_members(user_id, role),
          kore_documents(count)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('[KORE] useProjects load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  // ── Charger les membres du projet actif ───────────────────────────────
  const loadMembers = useCallback(async (projectId) => {
    if (!projectId) { setMembers([]); setMyRole(null); return; }
    try {
      const { data, error } = await supabase
        .from('kore_project_members')
        .select('*, profiles(id, full_name, email, avatar_url)')
        .eq('project_id', projectId);

      if (error) throw error;
      setMembers(data || []);

      const mine = data?.find(m => m.user_id === userId);
      setMyRole(mine?.role || null);
    } catch (err) {
      console.error('[KORE] loadMembers error:', err);
    }
  }, [userId]);

  // ── Sélectionner un projet actif ─────────────────────────────────────
  const selectProject = useCallback((project) => {
    setActiveProject(project);
    if (project) {
      loadMembers(project.id);
      // Persister en localStorage pour retrouver le projet au rechargement
      localStorage.setItem('kore_active_project', project.id);
    }
  }, [loadMembers]);

  // ── Créer un projet ───────────────────────────────────────────────────
  const createProject = useCallback(async ({ name, projectNumber, description }) => {
    try {
      const { data, error } = await supabase
        .from('kore_projects')
        .insert({ name, project_number: projectNumber, description, created_by: userId })
        .select()
        .single();

      if (error) throw error;
      await loadProjects();
      return { data, error: null };
    } catch (err) {
      console.error('[KORE] createProject error:', err);
      return { data: null, error: err };
    }
  }, [userId, loadProjects]);

  // ── Inviter un membre par email ───────────────────────────────────────
  const inviteMember = useCallback(async (projectId, email, role) => {
    try {
      // Chercher si l'utilisateur existe déjà dans profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();

      if (profile) {
        // Utilisateur existant → ajouter directement
        const { error } = await supabase
          .from('kore_project_members')
          .insert({ project_id: projectId, user_id: profile.id, role, invited_by: userId });

        if (error && error.code !== '23505') throw error; // 23505 = duplicate, ignorer
      } else {
        // Utilisateur inconnu → créer invitation
        const { error } = await supabase
          .from('kore_invitations')
    .upsert(
      { 
        project_id: projectId, 
        email, 
        role, 
        invited_by: userId 
      }, 
      { onConflict: 'project_id, email' } // Spécifie les colonnes uniques ici
    );

        if (error) throw error;
      }

      await loadMembers(projectId);
      return { error: null };
    } catch (err) {
      console.error('[KORE] inviteMember error:', err);
      return { error: err };
    }
  }, [userId, loadMembers]);

  // ── Changer le rôle d'un membre ───────────────────────────────────────
  const updateMemberRole = useCallback(async (memberId, newRole) => {
    try {
      const { error } = await supabase
        .from('kore_project_members')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: newRole } : m));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }, []);

  // ── Retirer un membre ─────────────────────────────────────────────────
  const removeMember = useCallback(async (memberId) => {
    try {
      const { error } = await supabase
        .from('kore_project_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;
      setMembers(prev => prev.filter(m => m.id !== memberId));
      return { error: null };
    } catch (err) {
      return { error: err };
    }
  }, []);

  return {
    projects, activeProject, members, loading, myRole,
    loadProjects, selectProject,
    createProject, inviteMember, updateMemberRole, removeMember,
  };
}
