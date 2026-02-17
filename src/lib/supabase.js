// ─────────────────────────────────────────────────────────
// SUPABASE CLIENT — Single Source of Truth
// Les clés sont lues depuis les variables d'environnement (.env)
// Ne jamais committer les vraies clés dans le repo Git !
// ─────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    '⚠️ Variables Supabase manquantes. Créez un fichier .env à la racine du projet.\n' +
    'Voir .env.example pour le format attendu.'
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
