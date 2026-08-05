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
  const descriptionScore = jaccardSimilarity(a.description, b.description);
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
  categoryMatch: boolean;
  locationScore: number;
  descriptionScore: number;
}

/** Every cross-type candidate above MATCH_THRESHOLD (not just the top one) for each of the user's own active reports — sorted best-first within each source report. */
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
        categoryMatch: breakdown.categoryMatch,
        locationScore: breakdown.locationScore,
        descriptionScore: breakdown.descriptionScore,
      });
    }
  }

  // Belt-and-suspenders: sourceType/matchedType must always be opposite —
  // a lost report can only ever match found reports and vice versa. This
  // can't actually happen given how `results` is built above (each loop
  // only ever draws matchedReportId from the opposite table), but this
  // guards against a future regression silently shipping same-type matches.
  const safe = results.filter((r) => {
    if (r.sourceType === r.matchedType) {
      console.error(`instantMatch: dropped same-type match ${r.sourceReportId} -> ${r.matchedReportId} (${r.sourceType})`);
      return false;
    }
    return true;
  });

  return safe.sort((a, b) => b.score - a.score);
}
