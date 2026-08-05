import { supabase } from '@/lib/supabase';
import { LostReport, FoundReport, ReportSummary, MatchQueueEntry } from '@/types/lostFound';

const BUCKET = 'lost-found-photos';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`/api/lost-found${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    throw new ApiError(res.status, (data && data.message) || res.statusText);
  }
  return data as T;
}

/**
 * Real implementation from day one — mirrors the shape of Marketplace's
 * listingService.ts (an interface with a swappable body), except there's no
 * mock here: this always calls the real /api/lost-found route handlers.
 */
export const lostFoundService = {
  createLostReport: (input: {
    category: string;
    description: string;
    lastSeenLocation: string;
    lostDate: string;
    photoUrl?: string;
    visibleToPublic?: boolean;
  }) => request<LostReport>('POST', '/lost-reports', input),

  createFoundReport: (input: {
    category: string;
    description: string;
    photoUrl: string;
    contentsWithheld?: boolean;
  }) => request<FoundReport>('POST', '/found-reports', input),

  checkin: (foundReportId: string, input: { itemLabel: string; storageRef?: string }) =>
    request('POST', `/found-reports/${foundReportId}/checkin`, input),

  browse: (query: { category?: string; location?: string; date?: string; status?: string; view?: 'map' | 'list' }) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    return request<ReportSummary[]>('GET', `/reports${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => request<ReportSummary & Record<string, unknown>>('GET', `/reports/${id}`),

  resolve: (lostReportId: string, input: { thankYouNote?: string }) =>
    request<{ status: string; badgeAwarded: boolean }>('POST', `/reports/${lostReportId}/resolve`, input),

  override: (reportId: string, decision: 'confirm' | 'reject') =>
    request('POST', `/reports/${reportId}/override`, { decision }),

  matchQueue: () => request<MatchQueueEntry[]>('GET', '/match-queue'),

  confirmMatch: (candidateId: string) => request('POST', `/match-candidates/${candidateId}/confirm`),
  rejectMatch: (candidateId: string) => request('POST', `/match-candidates/${candidateId}/reject`),

  createHandover: (input: { foundReportId: string; claimantId?: string; proofType: string }) =>
    request('POST', '/handovers', input),

  precision: (from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const qs = params.toString();
    return request('GET', `/metrics/precision${qs ? `?${qs}` : ''}`);
  },
};

/**
 * Mirrors SupabaseListingService.uploadImage — same private-bucket-path
 * convention as the original React Native build. The path's leading folder
 * ('1' or '3') reuses the existing Storage RLS policies unchanged (public-
 * readable vs custodian/admin-only) — those policies were always
 * effectively binary despite being framed as tiers, so no Storage migration
 * is needed for the tier-logic removal.
 */
export async function uploadLostFoundPhoto(file: File, reportType: 'lost' | 'found', isSensitive: boolean): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).slice(2)}_${Date.now()}.${fileExt}`;
  const path = `${isSensitive ? 3 : 1}/${reportType}/${fileName}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw new Error('Failed to upload photo: ' + error.message);
  return path;
}

/** photo_url is a private Storage path, not a public URL — resolve to a signed URL for display. */
export async function resolveLostFoundPhotoUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null;
  if (pathOrUrl.startsWith('http')) return pathOrUrl;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(pathOrUrl, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}
