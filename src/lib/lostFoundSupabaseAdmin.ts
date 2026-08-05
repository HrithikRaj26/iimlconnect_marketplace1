import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Service-role Supabase client for the Lost & Found API route handlers.
 * SERVER-ONLY — never import this from a "use client" component; the
 * service_role key bypasses RLS entirely (mirrors apps/api's SupabaseService
 * in the original NestJS build).
 *
 * Lazily initialized behind a Proxy rather than constructed at module load:
 * Next.js's build step imports every route handler module to inspect its
 * route config, so a top-level throw here (missing env vars) took down the
 * ENTIRE production build, not just Lost & Found — a real incident on the
 * first deploy. Deferring the env check to first actual use means a
 * misconfigured env var only breaks Lost & Found requests at runtime, not
 * every route in the app at build time.
 */
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for Lost & Found route handlers');
  }

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
