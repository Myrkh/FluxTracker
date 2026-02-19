// ═══════════════════════════════════════════════════════════════════════════
// KORE — SimilarityService
// Détection de doublons par similarité textuelle avancée
// Algorithmes : Jaccard + Levenshtein + TF-IDF
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Normalise et tokenise une chaîne de texte
 * @param {string} str
 * @returns {string[]}
 */
function tokenize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // supprime accents
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);        // ignore tokens très courts
}

/**
 * Distance de Levenshtein entre deux chaînes
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

/**
 * Similarité entre deux tokens avec tolérance aux fautes de frappe
 * Retourne 1.0 si identiques, 0.5 si distance Levenshtein ≤ 2, 0 sinon
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function tokenSimilarity(a, b) {
  if (a === b) return 1.0;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshtein(a, b);
  if (dist <= 1 && maxLen >= 5) return 0.85;
  if (dist <= 2 && maxLen >= 6) return 0.6;
  return 0;
}

/**
 * Calcule les poids TF-IDF pour une liste de documents
 * Les termes rares (techniques) sont pondérés plus fortement que les mots communs
 * @param {string[][]} allTokenSets - tableau de listes de tokens
 * @returns {Map<string, number>} poids IDF par terme
 */
function computeIDF(allTokenSets) {
  const docCount = allTokenSets.length;
  const docFreq = new Map();

  for (const tokens of allTokenSets) {
    const seen = new Set(tokens);
    for (const t of seen) {
      docFreq.set(t, (docFreq.get(t) || 0) + 1);
    }
  }

  const idf = new Map();
  for (const [term, freq] of docFreq) {
    idf.set(term, Math.log((docCount + 1) / (freq + 1)) + 1);
  }
  return idf;
}

/**
 * Calcule la similarité entre une nouvelle désignation et un corpus de documents
 * Combine Jaccard (avec tolérance Levenshtein) et TF-IDF
 *
 * @param {string} newTitle - désignation à tester
 * @param {Array<{title: string, discipline_code: string}>} docs - corpus existant
 * @param {string} discipline - discipline courante (filtre)
 * @param {number} threshold - seuil de similarité (défaut 0.35)
 * @returns {Array<{id, doc_number, title, discipline_code, score}>}
 */
export function findSimilarDocuments(newTitle, docs, discipline, threshold = 0.35) {
  if (!newTitle || newTitle.length < 5) return [];

  const sameDisciplineDocs = docs.filter(d => d.discipline_code === discipline);
  if (sameDisciplineDocs.length === 0) return [];

  const newTokens = tokenize(newTitle);
  const allTokenSets = [newTokens, ...sameDisciplineDocs.map(d => tokenize(d.title))];
  const idf = computeIDF(allTokenSets);

  const results = sameDisciplineDocs.map(doc => {
    const docTokens = tokenize(doc.title);

    // Score Jaccard avec tolérance Levenshtein + pondération TF-IDF
    let intersectionWeight = 0;
    let unionWeight = 0;

    const allTerms = new Set([...newTokens, ...docTokens]);
    for (const term of allTerms) {
      const weight = idf.get(term) || 1;
      const inNew = newTokens.some(t => tokenSimilarity(t, term) > 0.5);
      const inDoc = docTokens.some(t => tokenSimilarity(t, term) > 0.5);

      if (inNew && inDoc) intersectionWeight += weight;
      unionWeight += weight;
    }

    const score = unionWeight > 0 ? intersectionWeight / unionWeight : 0;
    return { ...doc, score: Math.round(score * 100) };
  });

  return results
    .filter(d => d.score >= Math.round(threshold * 100))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}
