import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.project_url;
const supabaseKey = process.env.SUPABASE_KEY || process.env.service_role;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase environment variables (SUPABASE_URL/SUPABASE_KEY or project_url/service_role) are missing. File uploads will fail.");
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null as any;
