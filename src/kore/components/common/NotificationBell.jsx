// ═══════════════════════════════════════════════════════════════════════════
// KORE — NotificationBell
// Cloche dans le header avec badge rouge live + modale de notifications
// ═══════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, FileText, Send, CheckCircle, Clock } from 'lucide-react';

// ── Icône par type de notification ──────────────────────────────────────
const TYPE_CONFIG = {
  SIGNATURE_PENDING:   { icon: Clock,       color: 'text-amber-500',  bg: 'bg-amber-50'  },
  SIGNATURE_DONE:      { icon: Check,       color: 'text-blue-500',   bg: 'bg-blue-50'   },
  VALIDATION_COMPLETE: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  BT_SENT:             { icon: Send,        color: 'text-[#009BA4]',  bg: 'bg-teal-50'   },
  BT_RECEIVED:         { icon: FileText,    color: 'text-[#003D5C]',  bg: 'bg-blue-50'   },
};

function NotifIcon({ type }) {
  const cfg  = TYPE_CONFIG[type] || TYPE_CONFIG.BT_SENT;
  const Icon = cfg.icon;
  return (
    <div className={`w-8 h-8 rounded-full ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
      <Icon className={`w-4 h-4 ${cfg.color}`} />
    </div>
  );
}

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

// ── Modale notifications ─────────────────────────────────────────────────
function NotificationModal({ notifications, unreadCount, onMarkAllRead, onMarkOneRead, onClose }) {
  return (
    <div className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">

      {/* Header modale */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#003D5C]" />
          <span className="font-bold text-[#003D5C] text-sm">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs font-bold bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="text-xs text-[#009BA4] hover:text-[#003D5C] font-medium transition-colors"
            >
              Tout marquer lu
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Liste */}
      <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
        {notifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">Aucune notification</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif.id}
              onClick={() => !notif.read && onMarkOneRead(notif.id)}
              className={`flex gap-3 px-4 py-3 transition-colors cursor-pointer
                ${notif.read
                  ? 'hover:bg-gray-50'
                  : 'bg-blue-50/40 hover:bg-blue-50/70 border-l-2 border-[#009BA4]'
                }`}
            >
              <NotifIcon type={notif.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold leading-tight ${notif.read ? 'text-gray-600' : 'text-[#003D5C]'}`}>
                    {notif.title}
                  </p>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                    {timeAgo(notif.created_at)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {notif.message}
                </p>
                {notif.doc_number && (
                  <span className="inline-block mt-1 text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    {notif.doc_number}
                  </span>
                )}
              </div>
              {!notif.read && (
                <div className="w-2 h-2 rounded-full bg-[#009BA4] flex-shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400 text-center">
            {notifications.length} notification{notifications.length > 1 ? 's' : ''}
            {unreadCount > 0 ? ` · ${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : ''}
          </p>
        </div>
      )}
    </div>
  );
}

// ── Composant principal — la cloche ─────────────────────────────────────
export function NotificationBell({ notifications, unreadCount, onMarkAllRead, onMarkOneRead }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Fermer en cliquant hors du composant
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen(v => !v);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-xl transition-all
          ${open
            ? 'bg-[#003D5C] text-white'
            : 'text-gray-500 hover:bg-gray-100 hover:text-[#003D5C]'
          }`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />

        {/* Badge rouge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white
            text-[10px] font-bold rounded-full flex items-center justify-center px-1 leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationModal
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAllRead={() => { onMarkAllRead(); }}
          onMarkOneRead={onMarkOneRead}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
