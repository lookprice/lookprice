import cron from 'node-cron';
import { pool } from '../../models/db';
import axios from 'axios';
import xml2js from 'xml2js';

export function startCronJobs() {
  console.log("Starting cron jobs...");

  // Example: Sync Amazon orders every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    console.log("[CRON] Running Amazon order sync...");
    try {
      const stores = await pool.query("SELECT id, amazon_settings FROM stores WHERE amazon_settings IS NOT NULL");
      
      for (const store of stores.rows) {
        if (store.amazon_settings && store.amazon_settings.accessToken) {
          // await syncAmazonOrders(...) // This needs to be implemented fully first
          console.log(`[CRON] Syncing Amazon for store ${store.id}`);
        }
      }
    } catch (e) {
      console.error("[CRON] Amazon sync failed", e);
    }
  });

  // TCMB Currency Rate Sync (Every day at 16:00)
  cron.schedule('0 16 * * *', async () => {
    console.log("[CRON] Running TCMB currency rate sync...");
    await syncTCMBRates();
  });

  console.log("Cron jobs started.");
}

export async function syncTCMBRates() {
  try {
    const { data } = await axios.get('https://www.tcmb.gov.tr/kurlar/today.xml');
    const parser = new xml2js.Parser();
    await new Promise<void>((resolve, reject) => {
      parser.parseString(data, async (err: any, result: any) => {
        if (err) {
          console.error("[CRON] TCMB sync failed to parse XML:", err);
          return resolve();
        }

        const currencies = result?.Tarih_Date?.Currency;
        if (!currencies || !Array.isArray(currencies)) {
          console.error("[CRON] TCMB sync failed: Invalid XML structure.");
          return resolve();
        }

        const rates: Record<string, number> = {};
        for (const c of currencies) {
          const code = c['$']?.CurrencyCode || c['$']?.Kod;
          if (['USD', 'EUR', 'GBP'].includes(code)) {
            const rateStr = (c.BanknoteSelling && c.BanknoteSelling[0]) || (c.ForexSelling && c.ForexSelling[0]);
            if (rateStr) {
              const rate = parseFloat(rateStr);
              if (!isNaN(rate)) {
                rates[code] = rate;
              }
            }
          }
        }

        if (Object.keys(rates).length > 0) {
          console.log(`[CRON] Extracted TCMB rates:`, rates);
          
          try {
            // Update all stores
            const storesRes = await pool.query("SELECT id, currency_rates FROM stores");
            for (const store of storesRes.rows) {
              let currentRates = {};
              try {
                if (typeof store.currency_rates === 'string') {
                  currentRates = JSON.parse(store.currency_rates);
                } else if (typeof store.currency_rates === 'object' && store.currency_rates !== null) {
                  currentRates = store.currency_rates;
                }
              } catch (e) {
                // Ignore parse errors, fallback to empty
              }

              const newRates = {
                ...currentRates,
                ...rates
              };

              await pool.query(
                "UPDATE stores SET currency_rates = $1 WHERE id = $2",
                [JSON.stringify(newRates), store.id]
              );
            }
            console.log(`[CRON] TCMB rates synced successfully for ${storesRes.rowCount} stores.`);
          } catch (e: any) {
            console.error("[CRON] TCMB sync db update failed:", e);
          }
        } else {
          console.error("[CRON] TCMB sync failed: Could not extract any rates.");
        }
        resolve();
      });
    });
  } catch (error: any) {
    console.error("[CRON] TCMB sync failed:", error.message);
  }
}
