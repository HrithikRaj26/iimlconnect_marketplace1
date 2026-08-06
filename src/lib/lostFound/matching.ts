import { lostFoundAdmin } from '../lostFoundSupabaseAdmin';
import { notifyConfirmedMatch } from './notifications';

/**
 * Single tunable constant for the precision-first matching gate (FR-3.3,
 * AC-4/AC-5). Ported from apps/api/src/config/matching.config.ts.
 */
export const MATCH_PRECISION_THRESHOLD = Number(process.env.MATCH_PRECISION_THRESHOLD ?? 0.55);

interface ScoreSignals {
  score: number;
  text_score: number;
  location_score: number;
  time_score: number;
  category_match: boolean;
}

/**
 * Ported from apps/api's MatchingService. Scoring itself runs in Postgres
 * (the match_score() function, applied via the combined migration) — this
 * module is the human-in-the-loop gate: only score >= threshold ever
 * becomes a persisted match_candidate row (AC-4 — below-threshold
 * candidates never enter the queue, by construction, since nothing is even
 * written for them), and persisted rows start at state='queued', never
 * 'confirmed', so the owner is notified only via an explicit custodian
 * decision (AC-5).
 */
async function scorePair(lostReportId: string, foundReportId: string): Promise<void> {
  const { data, error } = await lostFoundAdmin.rpc('match_score', {
    p_lost_id: lostReportId,
    p_found_id: foundReportId,
  });
  if (error) {
    console.error(`match_score rpc failed for ${lostReportId}/${foundReportId}: ${error.message}`);
    return;
  }
  const signals = data as ScoreSignals;
  if (signals.score < MATCH_PRECISION_THRESHOLD) {
    return; // AC-4: never persisted, never queued, owner never told
  }

  const { error: upsertError } = await lostFoundAdmin.from('match_candidate').upsert(
    {
      lost_report_id: lostReportId,
      found_report_id: foundReportId,
      score: signals.score,
      signals,
      state: 'queued',
    },
    { onConflict: 'lost_report_id,found_report_id' },
  );
  if (upsertError) {
    console.error(`match_candidate upsert failed: ${upsertError.message}`);
  }
}

export async function scoreNewLostReport(lostReportId: string): Promise<void> {
  const { data: candidates, error } = await lostFoundAdmin.from('found_report').select('id').eq('status', 'available');
  if (error) throw error;
  for (const found of candidates ?? []) {
    await scorePair(lostReportId, found.id);
  }
}

export async function scoreNewFoundReport(foundReportId: string): Promise<void> {
  const { data: candidates, error } = await lostFoundAdmin.from('lost_report').select('id').eq('status', 'open');
  if (error) throw error;
  for (const lost of candidates ?? []) {
    await scorePair(lost.id, foundReportId);
  }
}

export async function listQueue() {
  const { data, error } = await lostFoundAdmin
    .from('match_candidate')
    .select(
      `id, score, signals, state, created_at,
       lost_report:lost_report_id ( id, category, description, last_seen_location, lost_date, photo_url, sensitivity_tier, reporter_id ),
       found_report:found_report_id ( id, category, description, pickup_location, photo_url, sensitivity_tier, contents_withheld, finder_id )`,
    )
    .eq('state', 'queued')
    .order('score', { ascending: false });
  if (error) throw error;

  // Legacy sensitivity_tier column → plain is_sensitive boolean for the API response.
  return (data ?? []).map((row: any) => ({
    ...row,
    lost_report: row.lost_report && {
      ...row.lost_report,
      is_sensitive: row.lost_report.sensitivity_tier === 3,
      sensitivity_tier: undefined,
    },
    found_report: row.found_report && {
      ...row.found_report,
      is_sensitive: row.found_report.sensitivity_tier === 3,
      sensitivity_tier: undefined,
    },
  }));
}

/**
 * Shared confirm/reject path for both the normal custodian queue action and
 * an admin override (FR-3.4/3.5, FR-4.4). Every decision writes one
 * `confirmation` row regardless of who triggered it.
 */
export async function decide(
  matchCandidateId: string,
  decision: 'confirm' | 'reject',
  actingUserId: string,
): Promise<{ lostReportId: string; foundReportId: string } | null> {
  const { data: candidate, error: fetchError } = await lostFoundAdmin
    .from('match_candidate')
    .select('id, lost_report_id, found_report_id, state')
    .eq('id', matchCandidateId)
    .single();
  if (fetchError || !candidate) {
    return null;
  }

  const { error: confirmationError } = await lostFoundAdmin.from('confirmation').insert({
    match_candidate_id: matchCandidateId,
    custodian_id: actingUserId,
    decision,
  });
  if (confirmationError) throw confirmationError;

  if (decision === 'confirm') {
    await lostFoundAdmin.from('match_candidate').update({ state: 'confirmed' }).eq('id', matchCandidateId);
    await lostFoundAdmin.from('lost_report').update({ status: 'matched' }).eq('id', candidate.lost_report_id);
    await lostFoundAdmin.from('found_report').update({ status: 'matched' }).eq('id', candidate.found_report_id);

    const { data: lostReport } = await lostFoundAdmin
      .from('lost_report')
      .select('reporter_id')
      .eq('id', candidate.lost_report_id)
      .single();
    if (lostReport) {
      await notifyConfirmedMatch(lostReport.reporter_id, candidate.found_report_id);
    }
  } else {
    // AC-7: rejected candidates return to the pool (never re-enter the
    // queue on their own) and are never surfaced to the loser again.
    await lostFoundAdmin.from('match_candidate').update({ state: 'proposed' }).eq('id', matchCandidateId);
  }

  return { lostReportId: candidate.lost_report_id, foundReportId: candidate.found_report_id };
}

/** The confirmed match_candidate for a given found_report, if any (used for phone reveal). */
export async function getConfirmedMatchForFoundReport(foundReportId: string) {
  const { data, error } = await lostFoundAdmin
    .from('match_candidate')
    .select('id, lost_report_id, found_report_id')
    .eq('found_report_id', foundReportId)
    .eq('state', 'confirmed')
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** The confirmed match_candidate for a given lost_report, if any. */
export async function getConfirmedMatchForLostReport(lostReportId: string) {
  const { data, error } = await lostFoundAdmin
    .from('match_candidate')
    .select('id, lost_report_id, found_report_id')
    .eq('lost_report_id', lostReportId)
    .eq('state', 'confirmed')
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Latest match_candidate linked to a report (either side), used by override. */
export async function getLatestCandidateForReport(reportId: string) {
  const { data, error } = await lostFoundAdmin
    .from('match_candidate')
    .select('id')
    .or(`lost_report_id.eq.${reportId},found_report_id.eq.${reportId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
