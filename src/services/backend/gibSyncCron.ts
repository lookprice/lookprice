import { pool } from '../../../models/db';
import { getEInvoiceService } from '../../../routes/einvoice';

/**
 * GİB & Entegratör (MySoft) Otomatik Sağlık, Önbellek Tazeleme ve Durum Senkronizasyon Servisi
 * Bu servis:
 * 1. Bekleyen / Gönderilen fatura durumlarını MySoft'tan sorgulayıp DB'yi günceller (QUEUED -> ACCEPTED / REJECTED)
 * 2. Önbellekteki (official_taxpayer_cache) mükellef etiketlerini belirli aralıklarla tazeleyip null/boş etiketleri onarır
 * 3. GİB canlı mükellefiyet listesi ile senkronizasyon kontrollerini sağlar
 */
export async function runGibSyncCron(): Promise<void> {
  console.log('[GİB-CRON] Starting periodic GİB / MySoft synchronization cycle...');
  
  try {
    // 1. ADIM: Boş veya Geçersiz Önbellek Kayıtlarını Temizle & Onar
    const invalidCache = await pool.query(
      "SELECT vkn FROM official_taxpayer_cache WHERE alias IS NULL OR TRIM(alias) = '' OR alias = 'urn:mail:defaultpk' LIMIT 20"
    );
    
    if (invalidCache.rows.length > 0) {
      console.log(`[GİB-CRON] Found ${invalidCache.rows.length} invalid/empty taxpayer cache entries. Re-validating with MySoft...`);
      
      // Aktif bir mağazanın e-fatura servisini al
      const activeStore = await pool.query(
        "SELECT id FROM stores WHERE einvoice_settings IS NOT NULL AND (einvoice_settings->>'is_active')::boolean = true LIMIT 1"
      );
      
      if (activeStore.rows.length > 0) {
        const storeId = activeStore.rows[0].id;
        const service = await getEInvoiceService(storeId);
        
        for (const row of invalidCache.rows) {
          try {
            const check = await service.checkTaxpayer(row.vkn);
            if (check && check.alias && check.alias.trim() !== '') {
              await pool.query(
                "UPDATE official_taxpayer_cache SET taxpayer_title = $1, alias = $2, last_updated = NOW() WHERE vkn = $3",
                [check.title || '', check.alias, row.vkn]
              );
              console.log(`[GİB-CRON] Successfully refreshed taxpayer ${row.vkn} with alias: ${check.alias}`);
            } else {
              // Hala bulunamıyorsa cache'den sil ki bir sonraki işlemde canlı sorgulansın
              await pool.query("DELETE FROM official_taxpayer_cache WHERE vkn = $1", [row.vkn]);
              console.log(`[GİB-CRON] Removed dead cache entry for VKN ${row.vkn}`);
            }
          } catch (err: any) {
            console.warn(`[GİB-CRON] Failed to refresh VKN ${row.vkn}:`, err.message);
          }
        }
      }
    }

    // 2. ADIM: Süresi 15 günü geçmiş eski önbellek kayıtlarını tazele
    const staleCache = await pool.query(
      "SELECT vkn FROM official_taxpayer_cache WHERE last_updated < NOW() - INTERVAL '15 days' LIMIT 10"
    );
    if (staleCache.rows.length > 0) {
      const activeStore = await pool.query(
        "SELECT id FROM stores WHERE einvoice_settings IS NOT NULL AND (einvoice_settings->>'is_active')::boolean = true LIMIT 1"
      );
      if (activeStore.rows.length > 0) {
        const service = await getEInvoiceService(activeStore.rows[0].id);
        for (const row of staleCache.rows) {
          try {
            const check = await service.checkTaxpayer(row.vkn);
            if (check && check.alias) {
              await pool.query(
                "UPDATE official_taxpayer_cache SET taxpayer_title = $1, alias = $2, last_updated = NOW() WHERE vkn = $3",
                [check.title || '', check.alias, row.vkn]
              );
            }
          } catch (e) {
            // sessiz geç
          }
        }
      }
    }

    // 3. ADIM: Kuyrukta (QUEUED/PROCESSING) Bekleyen Satış Faturalarının GİB Durumunu Güncelle
    const pendingInvoices = await pool.query(
      `SELECT id, store_id, ettn, document_number 
       FROM sales_invoices 
       WHERE ettn IS NOT NULL 
         AND (integration_status IN ('QUEUED', 'PROCESSING', 'SENDING') OR integration_status IS NULL)
         AND document_number IS NOT NULL AND document_number != ''
         AND created_at >= NOW() - INTERVAL '7 days'
       LIMIT 10`
    );

    if (pendingInvoices.rows.length > 0) {
      console.log(`[GİB-CRON] Checking status for ${pendingInvoices.rows.length} pending e-invoices...`);
      for (const inv of pendingInvoices.rows) {
        try {
          const service = await getEInvoiceService(inv.store_id);
          const statusResult = await service.getInvoiceStatus(inv.ettn);
          if (statusResult && statusResult.status && statusResult.status !== 'UNKNOWN') {
            await pool.query(
              `UPDATE sales_invoices 
               SET integration_status = $1, integration_message = $2 
               WHERE id = $3`,
              [statusResult.status, statusResult.message || '', inv.id]
            );
            console.log(`[GİB-CRON] Invoice #${inv.id} (${inv.document_number}) updated: ${statusResult.status}`);
          }
        } catch (err: any) {
          console.warn(`[GİB-CRON] Invoice #${inv.id} status check error:`, err.message);
        }
      }
    }

    console.log('[GİB-CRON] Synchronization cycle finished successfully.');
  } catch (globalErr: any) {
    console.error('[GİB-CRON] Global error in GİB sync cron:', globalErr);
  }
}

/**
 * Cron Zamanlayıcısını Başlatır (Her 30 dakikada bir çalışır)
 */
export function initGibSyncScheduler(): void {
  // İlk açılışta 15 saniye sonra ilk taramayı yap
  setTimeout(() => {
    runGibSyncCron().catch(err => console.error('[GİB-CRON] Initial run failed:', err));
  }, 15000);

  // Her 30 dakikada bir otomatik döngü
  const INTERVAL_MS = 30 * 60 * 1000;
  setInterval(() => {
    runGibSyncCron().catch(err => console.error('[GİB-CRON] Interval run failed:', err));
  }, INTERVAL_MS);

  console.log('[GİB-CRON] GİB & MySoft auto-synchronization background scheduler initialized (every 30 mins).');
}
