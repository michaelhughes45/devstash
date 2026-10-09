// A piece of text to match a query against; higher weights rank matches in
// that field (e.g. a title) above matches elsewhere (e.g. a content preview)
export interface SearchField {
  text: string;
  weight: number;
  // Only whole substrings match when false; scattered characters in long text
  // (e.g. a content preview) would match almost any query
  fuzzy?: boolean;
}

const EXACT_MATCH_SCORE = 100;
const PREFIX_SCORE = 60;
const WORD_START_SCORE = 40;
const SUBSTRING_SCORE = 25;
const FUZZY_BASE_SCORE = 5;

function isWordStart(text: string, index: number): boolean {
  return index === 0 || /[^a-z0-9]/i.test(text[index - 1]);
}

// Scores the characters of `query` appearing in order in `text` (e.g. "dkr"
// in "docker"): more consecutive runs and word starts score higher. Returns
// null when they don't all appear.
function subsequenceScore(text: string, query: string): number | null {
  let score = FUZZY_BASE_SCORE;
  let textIndex = 0;
  let previous = -2;

  for (const char of query) {
    const found = text.indexOf(char, textIndex);
    if (found === -1) return null;
    if (found === previous + 1) score += 3;
    if (isWordStart(text, found)) score += 2;
    // Matches spread far apart are less likely to be what was meant
    score -= Math.min(found - textIndex, 10) * 0.1;
    previous = found;
    textIndex = found + 1;
  }
  // Always below a substring match
  return Math.min(Math.max(score, 1), SUBSTRING_SCORE - 1);
}

// Scores how well one lowercase query term matches `text`, or null for no match.
// Exact, prefix, word-start and substring matches beat scattered characters,
// which only match when `fuzzy` is true.
export function fuzzyScore(text: string, term: string, fuzzy = true): number | null {
  const haystack = text.toLowerCase();
  if (!term) return 0;
  if (haystack === term) return EXACT_MATCH_SCORE;
  if (haystack.startsWith(term)) return PREFIX_SCORE;

  let index = haystack.indexOf(term);
  if (index !== -1) {
    while (index !== -1) {
      if (isWordStart(haystack, index)) return WORD_START_SCORE;
      index = haystack.indexOf(term, index + 1);
    }
    return SUBSTRING_SCORE;
  }
  return fuzzy ? subsequenceScore(haystack, term) : null;
}

function toTerms(query: string): string[] {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

// Every term must match some field; the entry scores the sum of each term's
// best weighted match. Returns null when a term matches nothing.
function scoreFields(fields: SearchField[], terms: string[]): number | null {
  let total = 0;
  for (const term of terms) {
    let best: number | null = null;
    for (const { text, weight, fuzzy } of fields) {
      const score = fuzzyScore(text, term, fuzzy);
      if (score !== null && (best === null || score * weight > best)) best = score * weight;
    }
    if (best === null) return null;
    total += best;
  }
  return total;
}

// The best `limit` matches for `query`, best first; ties keep their original
// order. A blank query returns the first `limit` entries unchanged.
export function fuzzySearch<T>(
  entries: T[],
  query: string,
  getFields: (entry: T) => SearchField[],
  limit: number,
): T[] {
  const terms = toTerms(query);
  if (terms.length === 0) return entries.slice(0, limit);

  const matches: { entry: T; score: number; index: number }[] = [];
  entries.forEach((entry, index) => {
    const score = scoreFields(getFields(entry), terms);
    if (score !== null) matches.push({ entry, score, index });
  });

  return matches
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, limit)
    .map(({ entry }) => entry);
}
