// ═══════════════════════════════════════════════════════════════════════════
// KORE — KoreContext
// État global de l'application KORE
// ═══════════════════════════════════════════════════════════════════════════

import { createContext, useContext } from 'react';

export const KoreContext = createContext(null);

export function useKore() {
  const ctx = useContext(KoreContext);
  if (!ctx) throw new Error('useKore must be used within KoreContext.Provider');
  return ctx;
}
