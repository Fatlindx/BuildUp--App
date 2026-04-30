import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jmoeghchzdmgvrfoybve.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_p-Sx99FaB0UQStyCgVCgMQ_V53jIG_A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);