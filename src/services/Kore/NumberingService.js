// ═══════════════════════════════════════════════════════════════════════════
// KORE — NumberingService
// Génération des numéros selon HXAQ023 Rév.10
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Génère le N° d'affaire HXAQ023
 * Format : {centre}{distinctif}{annee}{NNN}
 * Ex: HTL001, RKL042
 *
 * @param {string} centre - lettre centre de profit
 * @param {string} distinctif - lettre code distinctif
 * @param {string} annee - lettre année
 * @param {string|number} ordre - numéro d'ordre (1-999)
 * @returns {string}
 */
export function buildProjectNumber(centre, distinctif, annee, ordre) {
  return `${centre}${distinctif}${annee}${String(ordre).padStart(3, '0')}`;
}

/**
 * Génère le N° de document complet HXAQ023
 * Format : {projet}-[émetteur]-[unité]-{discipline}-{séquence}-[suffixe]
 * Ex: HTL001-INS-0051-LPD, HTL001-ART-012-INS-0012-DTS
 *
 * @param {string} project - N° d'affaire
 * @param {string} emitter - code émetteur (optionnel)
 * @param {string} unit - code unité (optionnel)
 * @param {string} discipline - code discipline (obligatoire)
 * @param {string|number} sequence - numéro de séquence
 * @param {string} suffix - suffixe (optionnel)
 * @returns {string}
 */
export function buildDocNumber(project, emitter, unit, discipline, sequence, suffix) {
  const parts = [project];
  if (emitter && emitter !== 'ART') parts.push(emitter);
  if (unit && unit !== '000') parts.push(unit);
  parts.push(discipline);
  parts.push(String(sequence).padStart(4, '0'));
  if (suffix) parts.push(suffix);
  return parts.join('-');
}

/**
 * Calcule le prochain numéro de séquence pour une discipline dans un projet
 * @param {Array<{project_number: string, discipline_code: string, sequence_number: number}>} docs
 * @param {string} projectNumber
 * @param {string} discipline
 * @returns {string} numéro formaté sur 4 chiffres
 */
export function nextSequence(docs, projectNumber, discipline) {
  const existing = docs.filter(
    d => d.project_number === projectNumber && d.discipline_code === discipline
  );
  const max = existing.reduce((m, d) => Math.max(m, d.sequence_number || 0), 0);
  return String(max + 1).padStart(4, '0');
}
