import { lostFoundAdmin } from '../lostFoundSupabaseAdmin';
import { LostFoundUser } from '../lostFoundAuth';
import { isValidProofTypeForTier } from './tiers';
import { notifyHandoverUpdate } from './notifications';

export type HandoverResult =
  | { kind: 'ok'; handover: any }
  | { kind: 'missing_proof' }
  | { kind: 'not_found' }
  | { kind: 'invalid_proof_for_tier' };

/**
 * Ported from apps/api's HandoverService. AC-8/AC-9: 422-equivalent on
 * missing/invalid proof, exactly one audit row on success. approver_id is
 * always the authenticated custodian's own id — never client-supplied
 * (confirmed decision: an audit log's "who approved" field must not be
 * spoofable).
 */
export async function createHandover(
  custodian: LostFoundUser,
  input: { foundReportId: string; claimantId?: string; proofType?: string },
): Promise<HandoverResult> {
  if (!input.proofType) {
    return { kind: 'missing_proof' };
  }

  const { data: found, error: foundError } = await lostFoundAdmin
    .from('found_report')
    .select('id, sensitivity_tier, status')
    .eq('id', input.foundReportId)
    .maybeSingle();
  if (foundError) throw foundError;
  if (!found) return { kind: 'not_found' };

  if (!isValidProofTypeForTier(input.proofType, found.sensitivity_tier)) {
    return { kind: 'invalid_proof_for_tier' };
  }

  const { data: handover, error: handoverError } = await lostFoundAdmin
    .from('handover')
    .insert({
      found_report_id: input.foundReportId,
      claimant_id: input.claimantId ?? null,
      approver_id: custodian.id,
      proof_type: input.proofType,
    })
    .select()
    .single();
  if (handoverError) throw handoverError;

  await lostFoundAdmin
    .from('found_report')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', input.foundReportId);

  await notifyHandoverUpdate(input.claimantId, handover.id);
  return { kind: 'ok', handover };
}
