import { pool } from "../../models/db";

export const getAuthorizedStoreId = async (req: any, requestedStoreId: any) => {
  const currentStoreId = req.user.store_id;
  if (req.user.role === "superadmin") return parseInt(requestedStoreId || currentStoreId);
  if (!requestedStoreId || parseInt(requestedStoreId) === parseInt(currentStoreId)) return currentStoreId;

  // Check if requestedStoreId is a branch of currentStoreId
  const relationRes = await pool.query("SELECT id FROM stores WHERE id = $1 AND parent_id = $2", [requestedStoreId, currentStoreId]);
  if (relationRes.rows.length > 0) return parseInt(requestedStoreId);

  return null;
};

/**
 * Normalizes a string for Turkish-friendly case-insensitive search in SQL
 */
export const getTurkishSearchSnippet = (field: string, paramIndex: number) => {
  const normalizedField = `LOWER(REPLACE(REPLACE(REPLACE(\${field}::text, 'İ', 'i'), 'I', 'ı'), 'ı', 'i'))`;
  return `\${normalizedField} LIKE $\${paramIndex}`;
};

export const normalizeTurkishParam = (term: string) => {
  if (!term) return '%%';
  return `%\${term.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i')}%`;
};

export const getGeminiApiKey = () => {
  const key = process.env.GEMINI_API_KEY || 
         process.env.Gemini_API_Key || 
         process.env.Gemini_API_KEY || 
         process.env.GOOGLE_API_KEY || 
         process.env.VITE_GEMINI_API_KEY || 
         process.env.API_KEY || 
         '';
         
  if (key && !key.startsWith('AIza')) {
    throw new Error("Lütfen 'Secrets' sekmesindeki (sol alt) hatalı 'GEMINI_API_KEY' değerini silin. (Please delete the invalid 'GEMINI_API_KEY' from the Secrets tab to use the built-in system key.)");
  }

  return key;
};

export const API_KEY_ERROR = "AI API anahtarı bulunamadı. Lütfen 'Secrets' sekmesine (sol alt) 'GEMINI_API_KEY' adıyla anahtarınızı eklediğinizden ve sunucuyu yeniden başlattığınızdan emin olun. (AI API key not found. Please ensure you have added 'GEMINI_API_KEY' in the Secrets tab and restarted the server).";

export const PLAN_LIMITS: Record<string, number> = {
  'free': 50,
  'basic': 100,
  'pro': 500,
  'enterprise': 1000000000 // Unlimited
};

export async function checkProductLimit(storeId: number, additionalCount: number = 1) {
  const storeRes = await pool.query("SELECT plan FROM stores WHERE id = $1", [storeId]);
  const plan = storeRes.rows[0]?.plan || 'free';
  const limit = PLAN_LIMITS[plan] || 50;
  
  const currentCountRes = await pool.query("SELECT COUNT(*)::INT as count FROM products WHERE store_id = $1", [storeId]);
  const currentCount = currentCountRes.rows[0].count;
  
  return currentCount + additionalCount <= limit;
}
