import { lostFoundAdmin } from '../lostFoundSupabaseAdmin';
import { LostFoundUser } from '../lostFoundAuth';

/**
 * Live, non-persisted fuzzy matching shown to a reporter right after they
 * file (or whenever they revisit Browse) — separate from the custodian
 * queue's persisted `match_candidate`/Postgres `match_score()` pipeline in
 * `matching.ts`, which stays untouched. This one is deliberately simple:
 * token-overlap (Jaccard) text similarity, weighted category > location >
 * description per the requested priority order, computed on read.
 */

const CATEGORY_WEIGHT = 0.6;
const LOCATION_WEIGHT = 0.25;
const DESCRIPTION_WEIGHT = 0.15;
export const MATCH_THRESHOLD = 0.4;

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
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

interface Comparable {
  category: string;
  location: string;
  description: string;
}

function scorePair(a: Comparable, b: Comparable): number {
  const categoryScore = a.category.trim().toLowerCase() === b.category.trim().toLowerCase() ? 1 : 0;
  const locationScore = jaccardSimilarity(a.location, b.location);
  const descriptionScore = jaccardSimilarity(a.description, b.description);
  return categoryScore * CATEGORY_WEIGHT + locationScore * LOCATION_WEIGHT + descriptionScore * DESCRIPTION_WEIGHT;
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
}

/** Best cross-type match (if any, above MATCH_THRESHOLD) for each of the user's own active reports. */
export async function computeInstantMatches(user: LostFoundUser): Promise<InstantMatchItem[]> {
  const [{ data: myLost }, { data: myFound }, { data: allLost }, { data: allFound }] = await Promise.all([
    lostFoundAdmin.from('lost_report').select('*').eq('reporter_id', user.id).eq('status', 'open'),
    lostFoundAdmin.from('found_report').select('*').eq('finder_id', user.id).eq('status', 'available'),
    lostFoundAdmin.from('found_report').select('*').eq('status', 'available'),
    lostFoundAdmin.from('lost_report').select('*').eq('status', 'open'),
  ]);

  const results: InstantMatchItem[] = [];

  for (const lost of myLost ?? []) {
    const lostComparable: Comparable = { category: lost.category, location: lost.last_seen_location ?? '', description: lost.description ?? '' };
    let best: { row: any; score: number } | null = null;
    for (const found of allFound ?? []) {
      const score = scorePair(lostComparable, {
        category: found.category,
        // found_location (where it was actually found) is what's comparable to a
        // lost report's last-seen location — pickup_location is just the drop-off
        // point and is pinned to "PGP Office" for every sensitive item.
        location: found.found_location ?? found.pickup_location ?? '',
        description: found.description ?? '',
      });
      if (score >= MATCH_THRESHOLD && (!best || score > best.score)) best = { row: found, score };
    }
    if (best) {
      results.push({
        sourceReportId: lost.id,
        sourceType: 'lost',
        matchedReportId: best.row.id,
        matchedType: 'found',
        score: best.score,
        category: best.row.category,
        description: best.row.description,
        location: best.row.found_location ?? best.row.pickup_location,
        isSensitive: best.row.sensitivity_tier === 3,
      });
    }
  }

  for (const found of myFound ?? []) {
    const foundComparable: Comparable = {
      category: found.category,
      location: found.found_location ?? found.pickup_location ?? '',
      description: found.description ?? '',
    };
    let best: { row: any; score: number } | null = null;
    for (const lost of allLost ?? []) {
      const score = scorePair(foundComparable, {
        category: lost.category,
        location: lost.last_seen_location ?? '',
        description: lost.description ?? '',
      });
      if (score >= MATCH_THRESHOLD && (!best || score > best.score)) best = { row: lost, score };
    }
    if (best) {
      results.push({
        sourceReportId: found.id,
        sourceType: 'found',
        matchedReportId: best.row.id,
        matchedType: 'lost',
        score: best.score,
        category: best.row.category,
        description: best.row.description,
        location: best.row.last_seen_location,
        isSensitive: best.row.sensitivity_tier === 3,
      });
    }
  }

  return results.sort((a, b) => b.score - a.score);
}
