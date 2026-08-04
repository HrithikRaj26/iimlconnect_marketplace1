import { lostFoundAdmin } from '../lostFoundSupabaseAdmin';
import { LostFoundUser } from '../lostFoundAuth';
import { suggestTierForCategory } from './tiers';
import { getContact } from './identity';
import { notifyThankYou } from './notifications';
import * as matching from './matching';

const TIER3_HIDDEN_PHOTO = null;

export interface CreateLostReportInput {
  category: string;
  description: string;
  lastSeenLocation: string;
  lostDate: string;
  photoUrl?: string;
  sensitivityTier?: 1 | 2 | 3;
}

export interface CreateFoundReportInput {
  category: string;
  description: string;
  photoUrl: string;
  contentsWithheld?: boolean;
  sensitivityTier?: 1 | 2 | 3;
}

/** FR-1.3: auto-suggest by category; a custodian/admin caller may override it. */
function resolveTier(category: string, requestedTier: 1 | 2 | 3 | undefined, user: LostFoundUser): 1 | 2 | 3 {
  if (requestedTier && (user.role === 'custodian' || user.role === 'admin')) {
    return requestedTier;
  }
  return suggestTierForCategory(category);
}

export async function createLostReport(user: LostFoundUser, input: CreateLostReportInput) {
  const tier = resolveTier(input.category, input.sensitivityTier, user);
  const { data, error } = await lostFoundAdmin
    .from('lost_report')
    .insert({
      reporter_id: user.id,
      category: input.category,
      description: input.description,
      last_seen_location: input.lastSeenLocation,
      lost_date: input.lostDate,
      photo_url: input.photoUrl ?? null,
      sensitivity_tier: tier,
      status: 'open',
    })
    .select()
    .single();
  if (error) throw error;

  await matching.scoreNewLostReport(data.id);
  return data;
}

export async function createFoundReport(user: LostFoundUser, input: CreateFoundReportInput) {
  const tier = resolveTier(input.category, input.sensitivityTier, user);
  const { data, error } = await lostFoundAdmin
    .from('found_report')
    .insert({
      finder_id: user.id,
      category: input.category,
      description: input.description,
      photo_url: input.photoUrl,
      contents_withheld: input.contentsWithheld ?? false,
      pickup_location: 'Central Lost & Found Room',
      sensitivity_tier: tier,
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

/** FR-2.3/AC-3: Tier-3 photos hidden from everyone except custodian/admin/the report's own owner. */
function maybeHidePhoto(row: any, requester: LostFoundUser, ownerId: string): string | null {
  if (row.sensitivity_tier < 3) return row.photo_url;
  if (requester.role === 'custodian' || requester.role === 'admin') return row.photo_url;
  if (requester.id === ownerId) return row.photo_url;
  return TIER3_HIDDEN_PHOTO;
}

function toPublicLost(row: any, requester: LostFoundUser) {
  return { ...row, type: 'lost', photo_url: maybeHidePhoto(row, requester, row.reporter_id) };
}

function toPublicFound(row: any, requester: LostFoundUser) {
  return { ...row, type: 'found', photo_url: maybeHidePhoto(row, requester, row.finder_id) };
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
    foundQuery = foundQuery.ilike('pickup_location', `%${query.location}%`);
  }
  if (query.date) {
    lostQuery = lostQuery.eq('lost_date', query.date);
    foundQuery = foundQuery.gte('created_at', `${query.date}T00:00:00Z`).lt('created_at', `${query.date}T23:59:59.999Z`);
  }
  if (query.status) {
    lostQuery = lostQuery.eq('status', query.status);
    foundQuery = foundQuery.eq('status', query.status);
  }

  const [{ data: lost, error: lostError }, { data: found, error: foundError }] = await Promise.all([
    lostQuery.order('created_at', { ascending: false }),
    foundQuery.order('created_at', { ascending: false }),
  ]);
  if (lostError) throw lostError;
  if (foundError) throw foundError;

  const lostItems = (lost ?? []).map((r) => toPublicLost(r, requester));
  const foundItems = (found ?? []).map((r) => toPublicFound(r, requester));

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
      sensitivity_tier: r.sensitivity_tier,
    }));
  }
  return combined;
}

async function hydrateLostDetail(lost: any, requester: LostFoundUser) {
  const result = toPublicLost(lost, requester) as any;
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
  const result = toPublicFound(found, requester) as any;

  if (requester.role === 'custodian' || requester.role === 'admin' || requester.id === found.finder_id) {
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
  if (lost) return hydrateLostDetail(lost, requester);

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
