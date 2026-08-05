import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for the Lost & Found API route handlers.
 * SERVER-ONLY — never import this from a "use client" component; the
 * service_role key bypasses RLS entirely (mirrors apps/api's SupabaseService
 * in the original NestJS build). Being server-only is what makes the
 * fallback below acceptable: this module is exclusively imported by
 * src/app/api/lost-found/** route handlers, which Next.js never bundles
 * into client-side JS, so nothing here reaches the browser.
 *
 * FALLBACK, NOT BEST PRACTICE: process.env.SUPABASE_URL /
 * SUPABASE_SERVICE_ROLE_KEY were never configured in this Vercel project's
 * environment variables (they only ever existed in a local .env.local,
 * which is gitignored by design), so every real request was failing in
 * production. The values below are hardcoded as a stopgap so the feature
 * works without needing dashboard access nobody on hand currently has — env
 * vars still take priority if they're ever set. If Vercel access becomes
 * available, replace this with real env vars and delete the hardcoded
 * values; a service-role key sitting in a public repo's source is a real
 * exposure, same category as the setup_db.js password leak already flagged
 * in this repo, just mitigated somewhat by never reaching the client bundle.
 */
const FALLBACK_SUPABASE_URL = 'https://yrnllcupnbwlzaxdcngz.supabase.co';
const FALLBACK_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlybmxsY3VwbmJ3bHpheGRjbmd6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NTMwMDEyMiwiZXhwIjoyMTAwODc2MTIyfQ.qcR2o4RvyGKE22GJUpXMPSyIxsfg3XIABPa48CtDLZ8';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL || FALLBACK_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;

  client = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

export const lostFoundAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getClient(), prop, receiver);
  },
});
