import { pool } from '../../../models/db';
import { getEInvoiceService, importIncomingInvoicesForStore } from '../../../routes/einvoice';
import { logAudit } from './auditService';

/**
 * GİB & Entegratör (MySoft) Otomatik Sağlık, Önbellek Tazeleme ve Durum Senkronizasyon Servisi
 */
export async function runGibSyncCron(): Promise<void> {
  let storeId = 0;
  const anyStore = await pool.query("SELECT id FROM stores LIMIT 1");
  if (anyStore.rows.length > 0) {
    storeId = anyStore.rows[0].id;
  }
  console.log('[GİB-CRON] Starting periodic GİB / MySoft synchronization cycle...');
  await logAudit(storeId, null, 'GIB_SYNC_START', 'SYSTEM', null, 'Cron job started');
  
  try {
    // 1. ADIM: Boş veya Geçersiz Önbellek Kayıtlarını Temizle & Onar
    const invalidCache = await pool.query(
      "SELECT vkn FROM official_taxpayer_cache WHERE alias IS NULL OR TRIM(alias) = '' OR alias = 'urn:mail:defaultpk' LIMIT 20"
    );
    
    const validActiveStoreQuery = `
      SELECT id FROM stores 
      WHERE einvoice_settings IS NOT NULL 
        AND (einvoice_settings->>'is_active')::boolean = true
        AND COALESCE(branding->>'is_demo', 'false') != 'true'
        AND COALESCE(NULLIF(TRIM(einvoice_settings->>'username'), ''), NULLIF(TRIM(einvoice_settings->>'earchive_username'), '')) IS NOT NULL
        AND COALESCE(NULLIF(TRIM(einvoice_settings->>'password'), ''), NULLIF(TRIM(einvoice_settings->>'api_token'), '')) IS NOT NULL
      ORDER BY id ASC LIMIT 1
    `;

    if (invalidCache.rows.length > 0) {
      const activeStore = await pool.query(validActiveStoreQuery);
      
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
            } else if (check && check.documentType !== 'UNKNOWN') {
              await pool.query("DELETE FROM official_taxpayer_cache WHERE vkn = $1", [row.vkn]);
            }
          } catch (err: any) {
            // ignore background cache refresh error
          }
        }
      }
    }

    // 2. ADIM: Süresi 15 günü geçmiş eski önbellek kayıtlarını tazele
    const staleCache = await pool.query(
      "SELECT vkn FROM official_taxpayer_cache WHERE last_updated < NOW() - INTERVAL '15 days' LIMIT 10"
    );
    if (staleCache.rows.length > 0) {
      const activeStore = await pool.query(validActiveStoreQuery);
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
          }
        } catch (err: any) {
          // ignore status check error during background cron
        }
      }
    }

    // 4. ADIM: Otomatik Gelen Alış Faturaları Arka Plan Senkronizasyonu (Son 90 Gün - Kaçırılan Faturaları Önleme)
    try {
      const activeStoresForInbox = await pool.query(
        `SELECT id, einvoice_settings, branding FROM stores 
         WHERE einvoice_settings IS NOT NULL 
           AND (einvoice_settings->>'is_active')::boolean = true
           AND COALESCE(branding->>'is_demo', 'false') != 'true'
           AND COALESCE(NULLIF(TRIM(einvoice_settings->>'username'), ''), NULLIF(TRIM(einvoice_settings->>'earchive_username'), '')) IS NOT NULL
           AND COALESCE(NULLIF(TRIM(einvoice_settings->>'password'), ''), NULLIF(TRIM(einvoice_settings->>'api_token'), '')) IS NOT NULL`
      );
      if (activeStoresForInbox.rows.length > 0) {
        const endDateStr = new Date().toISOString().split('T')[0];
        const startDateObj = new Date();
        startDateObj.setDate(startDateObj.getDate() - 90);
        const startDateStr = startDateObj.toISOString().split('T')[0];

        for (const st of activeStoresForInbox.rows) {
          try {
            const storeId = st.id;
            const service = await getEInvoiceService(storeId);
            const incoming = await service.getIncomingInvoices(startDateStr, endDateStr);
            if (Array.isArray(incoming) && incoming.length > 0) {
              const { importedCount, updatedCount } = await importIncomingInvoicesForStore(
                storeId,
                startDateStr,
                endDateStr,
                undefined,
                incoming
              );
              if (importedCount > 0 || updatedCount > 0) {
                console.log(`[GİB-CRON] Store ${storeId}: auto-imported ${importedCount} missing, updated ${updatedCount} purchase invoices.`);
              }
            }
          } catch (storeSyncErr: any) {
            const msg = String(storeSyncErr?.message || '');
            if (!msg.includes('kimlik doğrulaması başarısız') && !msg.includes('Kullanıcı tanımsızdır') && !msg.includes('tanımlanmamış')) {
              console.info(`[GİB-CRON] Store ${st.id} sync skipped:`, msg);
            }
          }
        }
      }
    } catch (cronInboxErr: any) {
      // ignore background inbox check issues
    }

    console.log('[GİB-CRON] Synchronization cycle finished successfully.');
    await logAudit(storeId, null, 'GIB_SYNC_SUCCESS', 'SYSTEM', null, 'Cron job finished successfully');
  } catch (globalErr: any) {
    await logAudit(storeId, null, 'GIB_SYNC_ERROR', 'SYSTEM', null, `Cron error: ${globalErr.message}`);
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
