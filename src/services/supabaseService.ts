import { createClient } from '@supabase/supabase-js';

let cachedClient: any = null;

export const supabase = {
  get storage() {
    if (!cachedClient) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.project_url;
      const supabaseKey = process.env.SUPABASE_KEY || process.env.service_role;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase API key is missing. Please define SUPABASE_URL and SUPABASE_KEY.");
      }
      cachedClient = createClient(supabaseUrl, supabaseKey);
    }
    return cachedClient.storage;
  }
} as any;
