import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://facenagrjeuigfieocft.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Ne3D2DTJVVVt974spiHRFQ_zZLdbwJ0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
