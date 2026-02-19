// ═══════════════════════════════════════════════════════════════════════════
// KORE — Toast
// ═══════════════════════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';

export function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  const styles = {
    success: 'bg-[#009BA4] text-white',
    error:   'bg-red-600 text-white',
    warn:    'bg-amber-500 text-white',
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 flex-shrink-0" />,
    error:   <AlertCircle  className="w-4 h-4 flex-shrink-0" />,
    warn:    <AlertTriangle className="w-4 h-4 flex-shrink-0" />,
  };

  return (
    <div className={`fixed bottom-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium flex items-center gap-2 max-w-sm ${styles[type] || styles.success}`}>
      {icons[type] || icons.success}
      <span>{msg}</span>
    </div>
  );
}
