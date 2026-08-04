import { lostFoundAdmin } from '../lostFoundSupabaseAdmin';

const STORAGE_BUCKET = 'lost-found-photos';
const RETENTION_PURGE_DAYS = Number(process.env.RETENTION_PURGE_DAYS ?? 30);

/**
 * Ported from apps/api's RetentionService. AC-12/Section 18: purge reports +
 * their Storage photos ~30 days after status=resolved. "Purge" deletes the
 * Storage photo and redacts free-text fields while flipping status to
 * 'archived', rather than deleting the row outright — a hard delete would
 * cascade-break match_candidate/confirmation/handover FKs and violate the
 * Auditability NFR. Triggered by a Vercel Cron hitting this route (no
 * persistent process on serverless to run @nestjs/schedule-style timers in).
 */
export async function purgeResolvedReports(): Promise<{ lostPurged: number; foundPurged: number }> {
  const cutoff = new Date(Date.now() - RETENTION_PURGE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const lostPurged = await purgeTable('lost_report', cutoff, 'last_seen_location');
  const foundPurged = await purgeTable('found_report', cutoff, 'pickup_location');
  return { lostPurged, foundPurged };
}

async function purgeTable(
  table: 'lost_report' | 'found_report',
  cutoff: string,
  locationColumn: 'last_seen_location' | 'pickup_location',
): Promise<number> {
  const { data: rows, error } = await lostFoundAdmin
    .from(table)
    .select('id, photo_url')
    .eq('status', 'resolved')
    .not('resolved_at', 'is', null)
    .lte('resolved_at', cutoff);
  if (error) {
    console.error(`Retention query failed for ${table}: ${error.message}`);
    return 0;
  }
  if (!rows || rows.length === 0) return 0;

  for (const row of rows as any[]) {
    const photoUrl: string | null = row.photo_url;
    if (photoUrl && !photoUrl.startsWith('http')) {
      const { error: removeError } = await lostFoundAdmin.storage.from(STORAGE_BUCKET).remove([photoUrl]);
      if (removeError) {
        console.warn(`Failed to remove storage object ${photoUrl}: ${removeError.message}`);
      }
    }

    const redaction: Record<string, unknown> = {
      photo_url: null,
      description: '[purged]',
      status: 'archived',
      [locationColumn]: '[purged]',
    };

    const { error: updateError } = await lostFoundAdmin.from(table).update(redaction).eq('id', row.id);
    if (updateError) {
      console.error(`Failed to purge ${table} ${row.id}: ${updateError.message}`);
    }
  }
  return rows.length;
}
