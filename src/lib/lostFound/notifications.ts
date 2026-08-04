/**
 * Ported from apps/api's NotificationsService — still a stand-in for Team 1's
 * real notification engine (FCM + Supabase Realtime). Logs the trigger
 * points so they're wired correctly; swap for a real call when available.
 */
export async function notifyConfirmedMatch(ownerId: string, foundReportId: string): Promise<void> {
  console.log(`[notify] confirmed-match → owner=${ownerId} foundReport=${foundReportId}`);
}

export async function notifyHandoverUpdate(claimantId: string | undefined, handoverId: string): Promise<void> {
  console.log(`[notify] handover-update → claimant=${claimantId ?? 'unknown'} handover=${handoverId}`);
}

export async function notifyThankYou(finderId: string, note: string | undefined): Promise<void> {
  console.log(`[notify] thank-you → finder=${finderId} note=${note ?? '(none)'}`);
}
