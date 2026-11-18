import { pool } from "../../../models/db";

let isPiiMaskingRunning = false;
let hasSalesSourceColumnCached: boolean | null = null;

export const maskOldPiiData = async () => {
  if (isPiiMaskingRunning) return;
  isPiiMaskingRunning = true;
  console.log("[PII-MASKING-CRON] Starting PII masking job for Amazon orders (Data Protection Policy)...");
  try {
    // LookPrice / Amazon Data Protection Policy (DPP):
    // Mask PII data for orders older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Check if source column exists in sales table once
    if (hasSalesSourceColumnCached !== true) {
      const colCheck = await pool.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'sales' AND column_name = 'source'
      `);
      hasSalesSourceColumnCached = colCheck.rows.length > 0;
    }

    if (!hasSalesSourceColumnCached) {
      console.log("[PII-MASKING-CRON] 'source' column not found in 'sales' table yet, skipping PII mask cycle.");
      return;
    }

    // Batch update in 500-row chunks so large historical tables are never locked in one giant transaction
    let totalMasked = 0;
    for (let batch = 0; batch < 20; batch++) {
      const salesRes = await pool.query(`
        UPDATE sales 
        SET 
          customer_name = CONCAT(SUBSTRING(customer_name, 1, 1), '*** ', SUBSTRING(SPLIT_PART(customer_name, ' ', 2), 1, 1), '***'),
          customer_phone = '05** *** ** **'
        WHERE id IN (
          SELECT id FROM sales
          WHERE created_at < $1 
            AND source = 'Amazon'
            AND customer_name NOT LIKE '%***%'
          ORDER BY id ASC
          LIMIT 500
        )
        RETURNING id
      `, [thirtyDaysAgo]);

      const count = salesRes.rowCount || 0;
      totalMasked += count;
      if (count < 500) break;
    }

    if (totalMasked > 0) {
      console.log(`[PII-MASKING-CRON] Masked PII for ${totalMasked} Amazon sales.`);
    }
  } catch (error: any) {
    console.error("[PII-MASKING-CRON] Error masking PII:", error);
  } finally {
    isPiiMaskingRunning = false;
  }
};

export const initPiiMaskingScheduler = () => {
  // Run immediately on startup (async non-blocking)
  maskOldPiiData().catch(() => {});

  // Then run every 24 hours
  setInterval(() => {
    maskOldPiiData().catch(() => {});
  }, 24 * 60 * 60 * 1000);
};
