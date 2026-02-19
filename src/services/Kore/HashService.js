// ═══════════════════════════════════════════════════════════════════════════
// KORE — HashService
// Calcul SHA-256 pour l'intégrité documentaire
// Utilise crypto.subtle (API native navigateur, HTTPS requis)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Calcule le hash SHA-256 d'un fichier
 * @param {File} file - fichier uploadé
 * @returns {Promise<string>} hash hex 64 chars
 */
export async function hashFile(file) {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Formate un hash pour affichage court (8 premiers chars)
 * @param {string} hash
 * @returns {string}
 */
export function shortHash(hash) {
  if (!hash) return '';
  return hash.slice(0, 8).toUpperCase();
}

/**
 * Formate la taille d'un fichier de manière lisible
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}
