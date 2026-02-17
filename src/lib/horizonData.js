// ─────────────────────────────────────────────────────────
// HORIZON — Data layer Supabase
// Toutes les opérations BDD sont ici, séparées du composant UI
// ─────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

// ── TASKS ──────────────────────────────────────────────────

export function useHorizonTasks(userId) {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('horizon_tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const insert = async (task) => {
    const { data, error } = await supabase
      .from('horizon_tasks')
      .insert({ ...task, user_id: userId })
      .select()
      .single();
    if (!error) setItems(prev => [data, ...prev]);
    return { data, error };
  };

  const update = async (id, changes) => {
    const { data, error } = await supabase
      .from('horizon_tasks')
      .update(changes)
      .eq('id', id)
      .select()
      .single();
    if (!error) setItems(prev => prev.map(t => t.id === id ? data : t));
    return { data, error };
  };

  const remove = async (id) => {
    const { error } = await supabase
      .from('horizon_tasks')
      .delete()
      .eq('id', id);
    if (!error) setItems(prev => prev.filter(t => t.id !== id));
    return { error };
  };

  return { items, setItems, loading, reload: load, insert, update, remove };
}

// ── RISKS ──────────────────────────────────────────────────

export function useHorizonRisks(userId) {
  const [risks, setRisks]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) { setRisks([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('horizon_risks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (!error) setRisks(data || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const insertRisk = async (risk) => {
    const { data, error } = await supabase
      .from('horizon_risks')
      .insert({ ...risk, user_id: userId })
      .select()
      .single();
    if (!error) setRisks(prev => [data, ...prev]);
    return { data, error };
  };

  const removeRisk = async (id) => {
    const { error } = await supabase
      .from('horizon_risks')
      .delete()
      .eq('id', id);
    if (!error) setRisks(prev => prev.filter(r => r.id !== id));
    return { error };
  };

  return { risks, loading, reload: load, insertRisk, removeRisk };
}

// ── AUTH ───────────────────────────────────────────────────

export function useAuth() {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    // Écoute les changements (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (id) => {
    try {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    setProfile(data);
  } catch (error) {
    console.error('Erreur chargement profil:', error);
  } finally {
    setLoading(false);
  }
  };

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password });

  const signUp = (email, password, fullName) =>
    supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    });

  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signIn, signUp, signOut };
}
