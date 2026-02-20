// ═══════════════════════════════════════════════════════════════════════════
// KORE — useNotification Hook
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useCallback } from 'react';

export function useNotification() {
  const [notification, setNotification] = useState(null);

  const show = useCallback((msg, type = 'success') => {
    setNotification({ msg, type });
  }, []);

  const clear = useCallback(() => {
    setNotification(null);
  }, []);

  return { notification, show, clear };
}