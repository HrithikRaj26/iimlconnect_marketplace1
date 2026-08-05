import { lostFoundAdmin } from '../lostFoundSupabaseAdmin';
import { LostFoundUser } from '../lostFoundAuth';
import { isSensitiveCategory } from './tiers';
import { getContact } from './identity';
import { notifyThankYou } from './notifications';
import * as matching from './matching';

const SENSITIVE_HIDDEN_PHOTO = null;
const PHOTO_BUCKET = 'lost-found-photos';
export const PGP_OFFICE_LOCATION = 'PGP Office';

/**
 * Resolves a Storage path to a signed URL using the service-role client
 * (bypasses Storage RLS entirely). This used to happen client-side, with
 * the browser's own (unprivileged) session calling createSignedUrl directly
 * — which worked for Tier 1/2 photos (their Storage policy allows any
 * authenticated user) but silently failed for sensitive-item photos, whose
 * policy only allows custodian/admin with no owner exception. That meant
 * even the finder who uploaded a sensitive photo couldn't generate a
 * signed URL for their own upload. Resolving server-side, after our own
 * visibility check has already run, fixes this and matches how every other
 * piece of Lost & Found data already flows through the API rather than
 * direct-to-Supabase.
 */
async function resolveSignedPhotoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('http')) return path; // seed-script placeholder URLs
  const { data, error } = await lostFoundAdmin.storage.from(PHOTO_BUCKET).createSignedUrl(path, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export interface CreateLostReportInput {
  category: string;
  description: string;
  lastSeenLocation: string;
  lostDate: string;
  photoUrl?: string;
  isSensitive?: boolean;
  /** "Show to public" toggle — false withholds the report from other users (staff + reporter still see it). Defaults true. */
  visibleToPublic?: boolean;
}

export interface CreateFoundReportInput {
  category: string;
  description: string;
  photoUrl: string;
  contentsWithheld?: boolean;
  isSensitive?: boolean;
  /** Ignored (forced to PGP_OFFICE_LOCATION server-side) when the item is sensitive — never trust the client for this. */
  pickupLocation?: string;
  /** Where the item was actually found — distinct from pickupLocation (where it can be collected). This is what the matching algorithm compares against a lost report's last-seen location. */
  foundLocation: string;
}

/** Auto-classify by category (SENSITIVE_CATEGORIES); a custodian/admin caller may override it. */
function resolveSensitivity(category: string, requestedOverride: boolean | undefined, user: LostFoundUser): boolean {
  if (requestedOverride !== undefined && (user.role === 'custodian' || user.role === 'admin')) {
    return requestedOverride;
  }
  return isSensitiveCategory(category);
}

/** sensitivity_tier is a legacy DB column (kept as-is to avoid a migration + reuse existing Storage RLS folders '1'/'3'); everywhere else in the app this is a plain boolean. */
function sensitivityTierColumn(isSensitive: boolean): 1 | 3 {
  return isSensitive ? 3 : 1;
}

export async function createLostReport(user: LostFoundUser, input: CreateLostReportInput) {
  const sensitive = resolveSensitivity(input.category, input.isSensitive, user);
  const { data, error } = await lostFoundAdmin
    .from('lost_report')
    .insert({
      reporter_id: user.id,
      category: input.category,
      description: input.description,
      last_seen_location: input.lastSeenLocation,
      lost_date: input.lostDate,
      photo_url: input.photoUrl ?? null,
      sensitivity_tier: sensitivityTierColumn(sensitive),
      status: 'open',
      visible_to_public: input.visibleToPublic ?? true,
    })
    .select()
    .single();
  if (error) throw error;

  await matching.scoreNewLostReport(data.id);
  return data;
}

export async function createFoundReport(user: LostFoundUser, input: CreateFoundReportInput) {
  const sensitive = resolveSensitivity(input.category, input.isSensitive, user);
  // Sensitive items must be deposited at PGP Office — enforced server-side
  // regardless of what the client sent; the UI only disables the other
  // choice, it doesn't guarantee it wasn't bypassed.
  const pickupLocation = sensitive ? PGP_OFFICE_LOCATION : input.pickupLocation?.trim() || PGP_OFFICE_LOCATION;
  const { data, error } = await lostFoundAdmin
    .from('found_report')
    .insert({
      finder_id: user.id,
      category: input.category,
      description: input.description,
      photo_url: input.photoUrl,
      contents_withheld: input.contentsWithheld ?? false,
      pickup_location: pickupLocation,
      found_location: input.foundLocation,
      sensitivity_tier: sensitivityTierColumn(sensitive),
      status: 'available',
    })
    .select()
    .single();
  if (error) throw error;

  await matching.scoreNewFoundReport(data.id);
  return data;
}

export async function checkin(
  foundReportId: string,
  custodian: LostFoundUser,
  input: { itemLabel: string; storageRef?: string },
) {
  const { data: found, error: foundError } = await lostFoundAdmin
    .from('found_report')
    .select('id')
    .eq('id', foundReportId)
    .maybeSingle();
  if (foundError) throw foundError;
  if (!found) return null;

  const { data, error } = await lostFoundAdmin
    .from('desk_checkin')
    .insert({
      found_report_id: foundReportId,
      custodian_id: custodian.id,
      item_label: input.itemLabel,
      storage_ref: input.storageRef,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export interface BrowseQuery {
  category?: string;
  location?: string;
  date?: string;
  status?: string;
  view?: 'map' | 'list';
}

/**
 * Lost-report photos: hidden for sensitive items unless the viewer is
 * custodian/admin/the reporter — the owner's own photo of their own lost
 * item, kept conservative by default.
 *
 * Found-report photos: always resolved, sensitive or not. A found item is
 * already safely deposited (PGP Office for sensitive ones) — showing its
 * photo publicly is what lets the true owner recognize and claim it, which
 * is the actual point of the report; sensitivity here instead controls the
 * handover process (documentary proof, PGP-Office-only drop-off), not photo
 * visibility.
 */
async function resolveLostPhotoUrl(row: any, requester: LostFoundUser, ownerId: string): Promise<string | null> {
  if (!row.photo_url) return null;
  if (row.sensitivity_tier >= 3 && requester.role !== 'custodian' && requester.role !== 'admin' && requester.id !== ownerId) {
    return SENSITIVE_HIDDEN_PHOTO;
  }
  return resolveSignedPhotoUrl(row.photo_url);
}

async function resolveFoundPhotoUrl(row: any): Promise<string | null> {
  return resolveSignedPhotoUrl(row.photo_url);
}

/** "Show to public" toggle: a lost report with visible_to_public=false is withheld from everyone except the reporter and staff (custodian/admin). */
function canSeeWithheldLostReport(row: any, requester: LostFoundUser): boolean {
  if (row.visible_to_public !== false) return true;
  if (requester.role === 'custodian' || requester.role === 'admin') return true;
  return requester.id === row.reporter_id;
}

/** Strips the legacy sensitivity_tier column out of API responses in favor of a plain is_sensitive boolean. */
function withSensitivityFlag(row: any) {
  const { sensitivity_tier, ...rest } = row;
  return { ...rest, is_sensitive: sensitivity_tier === 3 };
}

async function toPublicLost(row: any, requester: LostFoundUser) {
  const photo_url = await resolveLostPhotoUrl(row, requester, row.reporter_id);
  return withSensitivityFlag({ ...row, type: 'lost', photo_url });
}

async function toPublicFound(row: any) {
  const photo_url = await resolveFoundPhotoUrl(row);
  return withSensitivityFlag({ ...row, type: 'found', photo_url });
}

export async function browse(query: BrowseQuery, requester: LostFoundUser) {
  let lostQuery = lostFoundAdmin.from('lost_report').select('*');
  let foundQuery = lostFoundAdmin.from('found_report').select('*');

  if (query.category) {
    lostQuery = lostQuery.ilike('category', `%${query.category}%`);
    foundQuery = foundQuery.ilike('category', `%${query.category}%`);
  }
  if (query.location) {
    lostQuery = lostQuery.ilike('last_seen_location', `%${query.location}%`);
    // Matches either where it was found or where it can be picked up.
    foundQuery = foundQuery.or(`pickup_location.ilike.%${query.location}%,found_location.ilike.%${query.location}%`);
  }
  if (query.date) {
    lostQuery = lostQuery.eq('lost_date', query.date);
    foundQuery = foundQuery.gte('created_at', `${query.date}T00:00:00Z`).lt('created_at', `${query.date}T23:59:59.999Z`);
  }
  if (query.status) {
    lostQuery = lostQuery.eq('status', query.status);
    foundQuery = foundQuery.eq('status', query.status);
  } else {
    // Archived (soft-deleted) reports never show up in an unfiltered browse — including My Reports.
    lostQuery = lostQuery.neq('status', 'archived');
    foundQuery = foundQuery.neq('status', 'archived');
  }

  const [{ data: lost, error: lostError }, { data: found, error: foundError }] = await Promise.all([
    lostQuery.order('created_at', { ascending: false }),
    foundQuery.order('created_at', { ascending: false }),
  ]);
  if (lostError) throw lostError;
  if (foundError) throw foundError;

  const lostItems = await Promise.all(
    (lost ?? []).filter((r) => canSeeWithheldLostReport(r, requester)).map((r) => toPublicLost(r, requester)),
  );
  const foundItems = await Promise.all((found ?? []).map((r) => toPublicFound(r)));

  const combined = [...lostItems, ...foundItems].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  if (query.view === 'map') {
    return combined.map((r) => ({
      id: r.id,
      type: r.type,
      category: r.category,
      status: r.status,
      location: r.type === 'lost' ? r.last_seen_location : r.pickup_location,
      is_sensitive: r.is_sensitive,
    }));
  }
  return combined;
}

async function hydrateLostDetail(lost: any, requester: LostFoundUser) {
  const result = (await toPublicLost(lost, requester)) as any;
  const confirmedMatch = await matching.getConfirmedMatchForLostReport(lost.id);
  if (confirmedMatch && requester.id === lost.reporter_id) {
    const { data: foundReport } = await lostFoundAdmin
      .from('found_report')
      .select('finder_id')
      .eq('id', confirmedMatch.found_report_id)
      .single();
    if (foundReport) {
      result.matchedFinderContact = await getContact(foundReport.finder_id);
    }
  }
  return result;
}

async function hydrateFoundDetail(found: any, requester: LostFoundUser) {
  const result = (await toPublicFound(found)) as any;

  if (requester.role === 'custodian' || requester.role === 'admin' || requester.id === found.finder_id) {
    result.finderContact = await getContact(found.finder_id);
    // Claimant identity retained on the item page once transfer completes, for future disputes.
    if (found.claimant_id) {
      result.claimantContact = await getContact(found.claimant_id);
    }
    return result;
  }

  // Direct claim flow: once claimed, the claimant sees the finder's contact
  // to arrange pickup — independent of the custodian-confirmed-match flow below.
  if (requester.id === found.claimant_id) {
    result.finderContact = await getContact(found.finder_id);
    return result;
  }

  const confirmedMatch = await matching.getConfirmedMatchForFoundReport(found.id);
  if (confirmedMatch) {
    const { data: lostReport } = await lostFoundAdmin
      .from('lost_report')
      .select('reporter_id')
      .eq('id', confirmedMatch.lost_report_id)
      .single();
    if (lostReport && lostReport.reporter_id === requester.id) {
      // AC-6: finder phone revealed to the owner only after a confirmed match links them.
      result.finderContact = await getContact(found.finder_id);
    }
  }
  return result;
}

export async function getById(id: string, requester: LostFoundUser) {
  const { data: lost } = await lostFoundAdmin.from('lost_report').select('*').eq('id', id).maybeSingle();
  if (lost) {
    // Withheld report: treated as not-found for anyone who isn't the
    // reporter or staff, same as a nonexistent id — no distinguishing
    // "exists but hidden" response that would leak the fact of its existence.
    if (!canSeeWithheldLostReport(lost, requester)) return null;
    return hydrateLostDetail(lost, requester);
  }

  const { data: found } = await lostFoundAdmin.from('found_report').select('*').eq('id', id).maybeSingle();
  if (found) return hydrateFoundDetail(found, requester);

  return null;
}

export async function resolve(
  lostReportId: string,
  user: LostFoundUser,
  input: { thankYouNote?: string },
): Promise<{ status: string; badgeAwarded: boolean } | 'not_found' | 'forbidden'> {
  const { data: lost, error } = await lostFoundAdmin
    .from('lost_report')
    .select('*')
    .eq('id', lostReportId)
    .maybeSingle();
  if (error) throw error;
  if (!lost) return 'not_found';
  if (lost.reporter_id !== user.id && user.role === 'user') return 'forbidden';

  await lostFoundAdmin
    .from('lost_report')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', lostReportId);

  const confirmedMatch = await matching.getConfirmedMatchForLostReport(lostReportId);
  if (confirmedMatch) {
    const { data: foundReport } = await lostFoundAdmin
      .from('found_report')
      .select('finder_id')
      .eq('id', confirmedMatch.found_report_id)
      .single();
    if (foundReport) {
      await lostFoundAdmin.from('recognition').insert({
        finder_id: foundReport.finder_id,
        badge_type: 'finder_recognition',
      });
      await notifyThankYou(foundReport.finder_id, input.thankYouNote);
    }
  }

  return { status: 'resolved', badgeAwarded: !!confirmedMatch };
}

export async function override(
  reportId: string,
  admin: LostFoundUser,
  decision: 'confirm' | 'reject',
): Promise<{ lostReportId: string; foundReportId: string } | null> {
  const candidate = await matching.getLatestCandidateForReport(reportId);
  if (!candidate) return null;
  return matching.decide(candidate.id, decision, admin.id);
}

export type ClaimResult = 'ok' | 'not_found' | 'sensitive_item' | 'already_claimed' | 'not_available';

/**
 * Self-service "this is mine" claim on a found report. Sensitive items are
 * excluded — those still route through the custodian-mediated handover
 * (documentary proof, PGP Office desk) rather than a bare click-to-claim.
 */
export async function claimItem(foundReportId: string, claimant: LostFoundUser): Promise<ClaimResult> {
  const { data: found, error } = await lostFoundAdmin
    .from('found_report')
    .select('id, status, sensitivity_tier, claimant_id')
    .eq('id', foundReportId)
    .maybeSingle();
  if (error) throw error;
  if (!found) return 'not_found';
  if (found.sensitivity_tier >= 3) return 'sensitive_item';
  if (found.claimant_id) return 'already_claimed';
  if (found.status !== 'available') return 'not_available';

  const { data: updated, error: updateError } = await lostFoundAdmin
    .from('found_report')
    .update({ claimant_id: claimant.id, claimed_at: new Date().toISOString() })
    .eq('id', foundReportId)
    .is('claimant_id', null) // race-safe: only succeeds if still unclaimed
    .select('id')
    .maybeSingle();
  if (updateError) throw updateError;
  if (!updated) return 'already_claimed';
  return 'ok';
}

export type CompleteTransferResult = 'ok' | 'not_found' | 'forbidden' | 'not_claimed';

/** Finder confirms the physical handoff to the claimant happened; claimant identity stays on the report for future disputes. */
export async function completeTransfer(foundReportId: string, finder: LostFoundUser): Promise<CompleteTransferResult> {
  const { data: found, error } = await lostFoundAdmin
    .from('found_report')
    .select('id, finder_id, claimant_id, transfer_completed_at')
    .eq('id', foundReportId)
    .maybeSingle();
  if (error) throw error;
  if (!found) return 'not_found';
  if (found.finder_id !== finder.id && finder.role !== 'admin') return 'forbidden';
  if (!found.claimant_id) return 'not_claimed';

  if (!found.transfer_completed_at) {
    const now = new Date().toISOString();
    await lostFoundAdmin
      .from('found_report')
      .update({ transfer_completed_at: now, status: 'resolved', resolved_at: now })
      .eq('id', foundReportId);
    await lostFoundAdmin.from('recognition').insert({
      finder_id: found.finder_id,
      badge_type: 'finder_recognition',
    });
  }
  return 'ok';
}

export type EditableReportInput = Partial<{
  category: string;
  description: string;
  photoUrl: string;
  lastSeenLocation: string; // lost only
  lostDate: string; // lost only
  visibleToPublic: boolean; // lost only
  pickupLocation: string; // found only
  foundLocation: string; // found only
}>;

export type MutateResult = 'ok' | 'not_found' | 'forbidden';

/** Owner-only edit. Sensitivity/pickup-location rules from create() are re-applied when category or pickupLocation change. */
export async function updateLostReport(id: string, user: LostFoundUser, input: EditableReportInput): Promise<MutateResult> {
  const { data: lost, error } = await lostFoundAdmin.from('lost_report').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!lost) return 'not_found';
  if (lost.reporter_id !== user.id && user.role !== 'admin') return 'forbidden';

  const patch: Record<string, unknown> = {};
  if (input.category !== undefined) patch.category = input.category;
  if (input.description !== undefined) patch.description = input.description;
  if (input.photoUrl !== undefined) patch.photo_url = input.photoUrl;
  if (input.lastSeenLocation !== undefined) patch.last_seen_location = input.lastSeenLocation;
  if (input.lostDate !== undefined) patch.lost_date = input.lostDate;
  if (input.visibleToPublic !== undefined) patch.visible_to_public = input.visibleToPublic;
  if (input.category !== undefined) {
    patch.sensitivity_tier = sensitivityTierColumn(resolveSensitivity(input.category, undefined, user));
  }

  const { error: updateError } = await lostFoundAdmin.from('lost_report').update(patch).eq('id', id);
  if (updateError) throw updateError;
  return 'ok';
}

export async function updateFoundReport(id: string, user: LostFoundUser, input: EditableReportInput): Promise<MutateResult> {
  const { data: found, error } = await lostFoundAdmin.from('found_report').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!found) return 'not_found';
  if (found.finder_id !== user.id && user.role !== 'admin') return 'forbidden';

  const category = input.category ?? found.category;
  const sensitive = resolveSensitivity(category, undefined, user);

  const patch: Record<string, unknown> = {};
  if (input.category !== undefined) patch.category = input.category;
  if (input.description !== undefined) patch.description = input.description;
  if (input.photoUrl !== undefined) patch.photo_url = input.photoUrl;
  if (input.foundLocation !== undefined) patch.found_location = input.foundLocation;
  if (input.category !== undefined) patch.sensitivity_tier = sensitivityTierColumn(sensitive);
  // Sensitive items are pinned to PGP Office regardless of what was requested — same rule as create().
  if (input.pickupLocation !== undefined || input.category !== undefined) {
    patch.pickup_location = sensitive ? PGP_OFFICE_LOCATION : (input.pickupLocation?.trim() || found.pickup_location);
  }

  const { error: updateError } = await lostFoundAdmin.from('found_report').update(patch).eq('id', id);
  if (updateError) throw updateError;
  return 'ok';
}

/** Soft-delete: reports may already be referenced by match_candidate/confirmation/handover rows, so archiving avoids FK violations while removing them from Browse. */
export async function archiveLostReport(id: string, user: LostFoundUser): Promise<MutateResult> {
  const { data: lost, error } = await lostFoundAdmin.from('lost_report').select('reporter_id').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!lost) return 'not_found';
  if (lost.reporter_id !== user.id && user.role !== 'admin') return 'forbidden';
  await lostFoundAdmin.from('lost_report').update({ status: 'archived' }).eq('id', id);
  return 'ok';
}

export async function archiveFoundReport(id: string, user: LostFoundUser): Promise<MutateResult> {
  const { data: found, error } = await lostFoundAdmin.from('found_report').select('finder_id').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!found) return 'not_found';
  if (found.finder_id !== user.id && user.role !== 'admin') return 'forbidden';
  await lostFoundAdmin.from('found_report').update({ status: 'archived' }).eq('id', id);
  return 'ok';
}

/** Type-agnostic wrappers for the single /reports/:id route — same lost-then-found probe pattern as getById(). */
export async function updateReport(id: string, user: LostFoundUser, input: EditableReportInput): Promise<MutateResult> {
  const { data: lost } = await lostFoundAdmin.from('lost_report').select('id').eq('id', id).maybeSingle();
  if (lost) return updateLostReport(id, user, input);
  const { data: found } = await lostFoundAdmin.from('found_report').select('id').eq('id', id).maybeSingle();
  if (found) return updateFoundReport(id, user, input);
  return 'not_found';
}

export async function archiveReport(id: string, user: LostFoundUser): Promise<MutateResult> {
  const { data: lost } = await lostFoundAdmin.from('lost_report').select('id').eq('id', id).maybeSingle();
  if (lost) return archiveLostReport(id, user);
  const { data: found } = await lostFoundAdmin.from('found_report').select('id').eq('id', id).maybeSingle();
  if (found) return archiveFoundReport(id, user);
  return 'not_found';
}
