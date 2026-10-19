import { pool } from '../../../models/db';
import { getEInvoiceService } from '../../../routes/einvoice';
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
    
    if (invalidCache.rows.length > 0) {
      console.log(`[GİB-CRON] Found ${invalidCache.rows.length} invalid/empty taxpayer cache entries. Re-validating with MySoft...`);
      
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

    // 4. ADIM: Otomatik Gelen Alış Faturaları Arka Plan Senkronizasyonu (Son 90 Gün - Kaçırılan Faturaları Önleme)
    try {
      const activeStoresForInbox = await pool.query(
        "SELECT id FROM stores WHERE einvoice_settings IS NOT NULL AND (einvoice_settings->>'is_active')::boolean = true"
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
              for (const inv of incoming) {
                const docNum = inv.documentNumber || inv.raw?.Id || '';
                const ettn = inv.ettn || inv.raw?.Uuid || '';
                if (!docNum && !ettn) continue;

                const existing = await pool.query(
                  "SELECT id FROM purchase_invoices WHERE store_id = $1 AND (ettn = $2 OR document_number = $3)",
                  [storeId, ettn, docNum]
                );
                if (existing.rows.length === 0) {
                  const grandAmt = Math.round((Number(inv.payableAmount) || 0) * 100) / 100;
                  const taxAmt = Math.round((Number(inv.taxAmount) || 0) * 100) / 100;
                  const baseAmt = Math.round(((Number(inv.baseAmount) || (grandAmt - taxAmt))) * 100) / 100;
                  
                  await pool.query(
                    `INSERT INTO purchase_invoices 
                    (store_id, invoice_number, document_number, ettn, e_document_type, supplier_name, tax_number, invoice_date, total_amount, tax_amount, grand_total, currency, exchange_rate, status, integration_status, payment_method, payment_status, is_tax_inclusive, is_expense)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
                    [
                      storeId,
                      docNum,
                      docNum,
                      ettn,
                      inv.documentType || 'EFATURA',
                      inv.senderTitle || 'Bilinmeyen Tedarikçi',
                      inv.senderVkn || '',
                      inv.issueDate ? (inv.issueDate.includes('.') ? inv.issueDate.split('.').reverse().join('-') : inv.issueDate) : new Date().toISOString().split('T')[0],
                      baseAmt,
                      taxAmt,
                      grandAmt,
                      inv.currency || 'TRY',
                      inv.exchangeRate || 1,
                      'approved',
                      'RECEIVED',
                      'term',
                      'unpaid',
                      false,
                      true
                    ]
                  );
                  console.log(`[GİB-CRON] Auto-imported missing purchase invoice ${docNum} (ETTN: ${ettn}) for store ${storeId}`);
                }
              }
            }
          } catch (storeSyncErr: any) {
            console.warn(`[GİB-CRON] Auto-sync purchase invoices error for store ${st.id}:`, storeSyncErr.message);
          }
        }
      }
    } catch (cronInboxErr: any) {
      console.warn(`[GİB-CRON] Background purchase invoice sync cron warning:`, cronInboxErr.message);
    }

    console.log('[GİB-CRON] Synchronization cycle finished successfully.');
    await logAudit(storeId, null, 'GIB_SYNC_SUCCESS', 'SYSTEM', null, 'Cron job finished successfully');
  } catch (globalErr: any) {
    console.error('[GİB-CRON] Global error in GİB sync cron:', globalErr);
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
