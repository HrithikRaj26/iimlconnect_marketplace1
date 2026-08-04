import { createClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for the Lost & Found API route handlers.
 * SERVER-ONLY — never import this from a "use client" component; the
 * service_role key bypasses RLS entirely (mirrors apps/api's SupabaseService
 * in the original NestJS build). Route handlers are the only place this
 * module's business rules (precision-gated matching, confirm-before-notify,
 * tier-scaled handover proof) are enforced, same as before.
 */
const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for Lost & Found route handlers');
}

export const lostFoundAdmin = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
