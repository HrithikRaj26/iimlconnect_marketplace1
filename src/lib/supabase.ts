import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yrnllcupnbwlzaxdcngz.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_iJuPcPvdUBWS50oxjcLKdA_5SATF6tq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
