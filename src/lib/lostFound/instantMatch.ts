import { lostFoundAdmin } from '../lostFoundSupabaseAdmin';
import { LostFoundUser } from '../lostFoundAuth';

/**
 * Live, non-persisted fuzzy matching shown to a reporter right after they
 * file (or whenever they revisit Browse) — separate from the custodian
 * queue's persisted `match_candidate`/Postgres `match_score()` pipeline in
 * `matching.ts`, which stays untouched. Weighted category > location >
 * description per the requested priority order, computed on read.
 * Location and category use strict exact-token matching (a 1-character
 * difference can mean a genuinely different room number or category);
 * description uses edit-distance-tolerant fuzzy word matching, so a typo
 * like "Jewwllery" still matches "Jewelry".
 */

const CATEGORY_WEIGHT = 0.6;
const LOCATION_WEIGHT = 0.25;
const DESCRIPTION_WEIGHT = 0.15;
export const MATCH_THRESHOLD = 0.4;

function tokenize(text: string): Set<string> {
  const normalized = text
    .toLowerCase()
    // Insert a boundary between letters and digits so "CR102" and "CR 102"
    // tokenize the same way — campus location codes are typed both ways
    // ("CR102" vs "CR 102", "H9" vs "H 9") and without this they'd never
    // overlap even though they mean the same place.
    .replace(/([a-z])(\d)/g, '$1 $2')
    .replace(/(\d)([a-z])/g, '$1 $2');
  return new Set(normalized.split(/[^a-z0-9]+/).filter(Boolean));
}

function jaccardSimilarity(a: string, b: string): number {
  const ta = tokenize(a);
  const tb = tokenize(b);
  if (ta.size === 0 || tb.size === 0) return 0;
  let intersection = 0;
  for (const t of ta) if (tb.has(t)) intersection++;
  const union = ta.size + tb.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}

const FUZZY_WORD_MIN_LENGTH = 5;
const FUZZY_WORD_SIMILARITY_THRESHOLD = 0.6;

/** Words shorter than FUZZY_WORD_MIN_LENGTH must match exactly (a 1-char edit on "keys" can mean an entirely different word — "keds" — so fuzzing short words trades typo-tolerance for false positives). Longer words are considered the same if their edit-distance similarity clears the threshold, so "Jewwllery" still matches "Jewelry". */
function wordsMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.length < FUZZY_WORD_MIN_LENGTH || b.length < FUZZY_WORD_MIN_LENGTH) return false;
  const maxLen = Math.max(a.length, b.length);
  const similarity = 1 - levenshteinDistance(a, b) / maxLen;
  return similarity >= FUZZY_WORD_SIMILARITY_THRESHOLD;
}

/** Jaccard-style overlap, but a word in `a` counts toward the intersection if it fuzzy-matches (see wordsMatch) any not-yet-used word in `b`, not just an exact one. Used for description only — location keeps strict exact-token matching, since a 1-character edit there can mean a genuinely different room number. */
function fuzzyTextSimilarity(a: string, b: string): number {
  const ta = [...tokenize(a)];
  const tb = [...tokenize(b)];
  if (ta.length === 0 || tb.length === 0) return 0;
  const usedB = new Set<number>();
  let matches = 0;
  for (const wa of ta) {
    let bestIdx = -1;
    for (let i = 0; i < tb.length; i++) {
      if (usedB.has(i)) continue;
      if (wordsMatch(wa, tb[i])) {
        bestIdx = i;
        break;
      }
    }
    if (bestIdx >= 0) {
      usedB.add(bestIdx);
      matches++;
    }
  }
  const union = ta.length + tb.length - matches;
  return union === 0 ? 0 : matches / union;
}

interface Comparable {
  category: string;
  location: string;
  description: string;
}

interface ScoreBreakdown {
  total: number;
  categoryMatch: boolean;
  locationScore: number;
  descriptionScore: number;
}

function scorePair(a: Comparable, b: Comparable): ScoreBreakdown {
  const categoryMatch = a.category.trim().toLowerCase() === b.category.trim().toLowerCase();
  const locationScore = jaccardSimilarity(a.location, b.location);
  const descriptionScore = fuzzyTextSimilarity(a.description, b.description);
  const total = (categoryMatch ? 1 : 0) * CATEGORY_WEIGHT + locationScore * LOCATION_WEIGHT + descriptionScore * DESCRIPTION_WEIGHT;
  return { total, categoryMatch, locationScore, descriptionScore };
}

/**
 * Category alone is worth 60% of the score — enough on its own to clear
 * MATCH_THRESHOLD (40%). Left unguarded, every found report would "match"
 * every open lost report of the same category regardless of where either
 * was seen or how they're described, which stops being a useful signal the
 * moment there's more than a couple of reports per category. Category
 * match is required (it's the top-priority signal) but not sufficient by
 * itself — there also has to be *some* location or description overlap.
 */
function qualifies(breakdown: ScoreBreakdown): boolean {
  if (breakdown.total < MATCH_THRESHOLD) return false;
  if (!breakdown.categoryMatch) return true; // location+description alone can still clear the threshold on a strong text match
  return breakdown.locationScore > 0 || breakdown.descriptionScore > 0;
}

export interface InstantMatchItem {
  sourceReportId: string;
  sourceType: 'lost' | 'found';
  matchedReportId: string;
  matchedType: 'lost' | 'found';
  score: number;
  category: string;
  description: string;
  location: string;
  isSensitive: boolean;
  /** Whether the matched report can actually be opened by someone who isn't its owner/staff. Found reports have no such concept (always true); a lost report can be true even when sensitive — only its own visible_to_public flag withholds it. */
  visibleToPublic: boolean;
  categoryMatch: boolean;
  locationScore: number;
  descriptionScore: number;
}

/** Every cross-type candidate above MATCH_THRESHOLD (not just the top one) for each of the user's own active reports — sorted best-first within each source report. */
export async function computeInstantMatches(user: LostFoundUser): Promise<InstantMatchItem[]> {
  const [{ data: myLost }, { data: myFound }, { data: allLost }, { data: allFound }] = await Promise.all([
    lostFoundAdmin.from('lost_report').select('*').eq('reporter_id', user.id).eq('status', 'open'),
    lostFoundAdmin.from('found_report').select('*').eq('finder_id', user.id).eq('status', 'available'),
    lostFoundAdmin.from('lost_report').select('*').eq('status', 'open'),
    lostFoundAdmin.from('found_report').select('*').eq('status', 'available'),
  ]);

  const results: InstantMatchItem[] = [];

  for (const lost of myLost ?? []) {
    const lostComparable: Comparable = { category: lost.category, location: lost.last_seen_location ?? '', description: lost.description ?? '' };
    for (const found of allFound ?? []) {
      const breakdown = scorePair(lostComparable, {
        category: found.category,
        // found_location (where it was actually found) is what's comparable to a
        // lost report's last-seen location — pickup_location is just the drop-off
        // point and is pinned to "PGP Office" for every sensitive item.
        location: found.found_location ?? found.pickup_location ?? '',
        description: found.description ?? '',
      });
      if (!qualifies(breakdown)) continue;
      results.push({
        sourceReportId: lost.id,
        sourceType: 'lost',
        matchedReportId: found.id,
        matchedType: 'found',
        score: breakdown.total,
        category: found.category,
        description: found.description,
        location: found.found_location ?? found.pickup_location,
        isSensitive: found.sensitivity_tier === 3,
        visibleToPublic: true,
        categoryMatch: breakdown.categoryMatch,
        locationScore: breakdown.locationScore,
        descriptionScore: breakdown.descriptionScore,
      });
    }
  }

  for (const found of myFound ?? []) {
    const foundComparable: Comparable = {
      category: found.category,
      location: found.found_location ?? found.pickup_location ?? '',
      description: found.description ?? '',
    };
    for (const lost of allLost ?? []) {
      const breakdown = scorePair(foundComparable, {
        category: lost.category,
        location: lost.last_seen_location ?? '',
        description: lost.description ?? '',
      });
      if (!qualifies(breakdown)) continue;
      results.push({
        sourceReportId: found.id,
        sourceType: 'found',
        matchedReportId: lost.id,
        matchedType: 'lost',
        score: breakdown.total,
        category: lost.category,
        description: lost.description,
        location: lost.last_seen_location,
        isSensitive: lost.sensitivity_tier === 3,
        visibleToPublic: lost.visible_to_public !== false,
        categoryMatch: breakdown.categoryMatch,
        locationScore: breakdown.locationScore,
        descriptionScore: breakdown.descriptionScore,
      });
    }
  }

  // Belt-and-suspenders: sourceType/matchedType must always be opposite, and
  // a report can never match itself. Neither can actually happen given how
  // `results` is built above, but a same-type-label check alone previously
  // missed a real bug (the allLost/allFound queries above were swapped, so
  // the *labels* stayed 'lost'/'found' correctly even while matchedReportId
  // was quietly drawn from the wrong table — including, sometimes, the
  // source's own row). Checking the id explicitly catches that class of bug
  // even when the type labels look fine.
  const safe = results.filter((r) => {
    if (r.sourceReportId === r.matchedReportId) {
      console.error(`instantMatch: dropped self-match ${r.sourceReportId}`);
      return false;
    }
    if (r.sourceType === r.matchedType) {
      console.error(`instantMatch: dropped same-type match ${r.sourceReportId} -> ${r.matchedReportId} (${r.sourceType})`);
      return false;
    }
    return true;
  });

  return safe.sort((a, b) => b.score - a.score);
}
