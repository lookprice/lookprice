import { pool } from "../../../models/db";

export const maskOldPiiData = async () => {
  console.log("[PII-MASKING-CRON] Starting PII masking job for Amazon orders (Data Protection Policy)...");
  try {
    // LookPrice / Amazon Data Protection Policy (DPP):
    // Mask PII data for orders older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Update sales table (Masking PII)
    const salesRes = await pool.query(`
      UPDATE sales 
      SET 
        customer_name = CONCAT(SUBSTRING(customer_name, 1, 1), '*** ', SUBSTRING(SPLIT_PART(customer_name, ' ', 2), 1, 1), '***'),
        customer_phone = '05** *** ** **'
      WHERE 
        created_at < $1 
        AND source = 'Amazon'
        AND customer_name NOT LIKE '%***%'
      RETURNING id
    `, [thirtyDaysAgo]);

    if (salesRes.rowCount && salesRes.rowCount > 0) {
      console.log(`[PII-MASKING-CRON] Masked PII for ${salesRes.rowCount} Amazon sales.`);
    }

    // You could also mask customers table if they were solely created by Amazon,
    // but typically we mask the order-level PII first.
  } catch (error: any) {
    console.error("[PII-MASKING-CRON] Error masking PII:", error);
  }
};

export const initPiiMaskingScheduler = () => {
  // Run immediately on startup
  maskOldPiiData();

  // Then run every 24 hours
  setInterval(() => {
    maskOldPiiData();
  }, 24 * 60 * 60 * 1000);
};
