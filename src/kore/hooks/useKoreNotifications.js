// ═══════════════════════════════════════════════════════════════════════════
// KORE — useKoreNotifications Hook
// Chargement des notifications + Supabase Realtime (badge live)
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

const MAX_NOTIFICATIONS = 50;

export function useKoreNotifications(userId) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);

  // ── Chargement initial ─────────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!userId) { setNotifications([]); setUnreadCount(0); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('kore_notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_NOTIFICATIONS);

      if (error) throw error;
      const notifs = data || [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (err) {
      console.error('[KORE] useKoreNotifications load error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // ── Supabase Realtime ──────────────────────────────────────────────────
  // Badge se met à jour instantanément sans refresh quand une nouvelle
  // notification est insérée pour cet utilisateur
  useEffect(() => {
    if (!userId) return;

    load();

    const channel = supabase
      .channel(`kore_notifications_${userId}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'kore_notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new;
          setNotifications(prev => [newNotif, ...prev].slice(0, MAX_NOTIFICATIONS));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, load]);

  // ── Marquer comme lues ────────────────────────────────────────────────
  const markAllRead = useCallback(async () => {
    if (!userId) return;
    try {
      await supabase
        .from('kore_notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[KORE] markAllRead error:', err);
    }
  }, [userId]);

  const markOneRead = useCallback(async (notifId) => {
    try {
      await supabase
        .from('kore_notifications')
        .update({ read: true })
        .eq('id', notifId);

      setNotifications(prev =>
        prev.map(n => n.id === notifId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[KORE] markOneRead error:', err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    reload:      load,
    markAllRead,
    markOneRead,
  };
}
