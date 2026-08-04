import { lostFoundAdmin } from '../lostFoundSupabaseAdmin';

/**
 * Ported from apps/api's MetricsService. FR-6.1/AC-11 — lightweight
 * precision readout, the semester-1 metric.
 *
 * NOTE ON DEFINITION: Section 17 defines match precision as "confirmed
 * matches truly the same item ÷ all confirmed matches" — i.e. ground truth
 * on whether a confirmed match later turned out correct. The MVP schema has
 * no field capturing that outcome (a verified/false-claim flag is Should-
 * tier, tied to FR-4.5 claimant-ID, out of scope). This reports the best
 * proxy available: confirmed ÷ (confirmed + rejected) custodian decisions
 * over the date range.
 */
export async function precision(from?: string, to?: string) {
  let query = lostFoundAdmin.from('confirmation').select('decision, decided_at');
  if (from) query = query.gte('decided_at', from);
  if (to) query = query.lte('decided_at', to);

  const { data, error } = await query;
  if (error) throw error;

  const confirmedCount = (data ?? []).filter((row) => row.decision === 'confirm').length;
  const rejectedCount = (data ?? []).filter((row) => row.decision === 'reject').length;
  const total = confirmedCount + rejectedCount;

  return {
    from: from ?? null,
    to: to ?? null,
    confirmedCount,
    rejectedCount,
    precision: total > 0 ? confirmedCount / total : null,
    note:
      "Proxy metric: confirmed / (confirmed + rejected) custodian decisions — see this file's comment for why this differs from Section 17's literal definition in the MVP schema.",
  };
}
