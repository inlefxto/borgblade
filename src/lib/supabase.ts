console.log('SUPABASE URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('SUPABASE KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.slice(0, 20));

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);
