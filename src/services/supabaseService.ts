import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.project_url;
const supabaseKey = process.env.service_role;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase environment variables are missing");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
