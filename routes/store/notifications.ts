import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// --- Notifications & Alerts ---

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const feed: any[] = [];
    const nowIso = new Date().toISOString();

    // Fetch store info first
    const storeRes = await pool.query("SELECT sector, branding FROM stores WHERE id = $1", [storeId]);
    const { sector, branding } = storeRes.rows[0] || { sector: 'RETAIL', branding: {} };
    const isHotelModuleActive = branding?.hotel_module_enabled === true;
    const isPortfolio = sector === 'REAL_ESTATE' || sector === 'AUTOMOTIVE';
    const isAutomotive = sector === 'AUTOMOTIVE';
    const isCafeRestaurant = sector === 'HORECA';

    const transfersCount = await pool.query(
      `SELECT COUNT(*) FROM stock_transfers 
       WHERE (to_store_id = $1 AND status = 'shipped')
          OR (from_store_id = $1 AND status IN ('pending', 'accepted', 'preparing'))`,
      [storeId]
    );

    const serviceCount = !isCafeRestaurant ? await pool.query(
      "SELECT COUNT(*) FROM service_records WHERE store_id = $1 AND status = 'received'",
      [storeId]
    ) : { rows: [{ count: 0 }] };

    const quotationsCount = await pool.query(
      "SELECT COUNT(*) FROM quotations WHERE store_id = $1 AND status = 'pending'",
      [storeId]
    );

    const salesCount = await pool.query(
      `SELECT COUNT(*) FROM sales 
       WHERE store_id = $1 
         AND status IN ('pending', 'processing', 'preparing')`,
      [storeId]
    );

    const marketplacePendingCount = await pool.query(
      `SELECT COUNT(*) FROM sales 
       WHERE store_id = $1 
         AND status IN ('pending', 'processing', 'preparing')
         AND source IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti')`,
      [storeId]
    );

    const cancelledOrdersCount = await pool.query(
      `SELECT COUNT(*) FROM sales 
       WHERE store_id = $1 
         AND status = 'cancelled'
         AND (source IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti') OR notes LIKE '%Web Siparişi%')`,
      [storeId]
    );

    const webSalesCount = await pool.query(
      `SELECT COUNT(*) FROM sales 
       WHERE store_id = $1 
         AND status IN ('pending', 'processing', 'preparing') 
         AND (payment_method IN ('iyzico', 'credit_card', 'bank_transfer', 'cash_on_delivery', 'paypal', 'payoneer', 'store_reservation') OR notes LIKE '%E-posta:%' OR notes LIKE '%Web Siparişi%')`,
      [storeId]
    );

    const expiringDocsCount = isAutomotive ? await pool.query(
      `SELECT COUNT(*) FROM vehicle_documents vd
       JOIN vehicles v ON vd.vehicle_id = v.id
       WHERE v.store_id = $1 AND vd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND vd.expiry_date >= CURRENT_DATE`,
      [storeId]
    ) : { rows: [{ count: 0 }] };

    const maintenanceDueCount = isAutomotive ? await pool.query(
      `SELECT COUNT(*) FROM vehicle_maintenance vm
       JOIN vehicles v ON vm.vehicle_id = v.id
       WHERE v.store_id = $1 
       AND vm.status = 'scheduled'
       AND (vm.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days' OR (v.current_mileage >= vm.next_maintenance_mileage - 1000 AND vm.next_maintenance_mileage > 0))`,
      [storeId]
    ) : { rows: [{ count: 0 }] };

    const salesInvoicesCount = await pool.query(
      `SELECT COUNT(*) FROM sales_invoices 
       WHERE store_id = $1 AND integration_status IN ('REJECTED', 'Hata', 'İptal', 'İptal Edildi', 'Hatalı', 'CANCELLED')`,
      [storeId]
    );

    const purchaseInvoicesCount = !isPortfolio ? await pool.query(
      `SELECT COUNT(*) FROM purchase_invoices 
       WHERE store_id = $1 AND is_read = false`,
      [storeId]
    ) : { rows: [{ count: 0 }] };

    const salesInvoicesNotSentCount = await pool.query(
      `SELECT COUNT(*) FROM sales_invoices 
       WHERE store_id = $1 
         AND status NOT IN ('cancelled', 'iptal')
         AND (integration_status IS NULL OR integration_status IN ('', 'NOT_SENT', 'DRAFT', 'UNKNOWN', 'BILINMIYOR'))
         AND (ettn IS NULL OR length(trim(ettn)) < 5)`,
      [storeId]
    );

    const criticalStockCount = await pool.query(
      `SELECT COUNT(*) FROM products 
       WHERE store_id = $1 
         AND (stock_quantity <= COALESCE(min_stock_level, 0) OR stock_quantity <= 0)`,
      [storeId]
    );

    let crmLeadsCount = 0;
    try {
      if (isPortfolio) {
        const crmRes = await pool.query(
          "SELECT COUNT(*) FROM real_estate_contacts WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '30 days'",
          [storeId]
        );
        crmLeadsCount = parseInt(crmRes.rows[0]?.count || '0');
      }
    } catch (e) {}

    let hotelReservationsCount = 0;
    try {
      if (isHotelModuleActive) {
        const hotelRes = await pool.query(
          "SELECT COUNT(*) FROM hotel_reservations WHERE store_id = $1 AND status = 'pending_action'",
          [storeId]
        );
        hotelReservationsCount = parseInt(hotelRes.rows[0]?.count || '0');
      }
    } catch (err) {}

    // 11. Cari Mutabakat Yanıtları (Disputed & Confirmed)
    let reconDisputedCount = 0;
    let reconConfirmedCount = 0;
    try {
      const reconRes = await pool.query(
        `SELECT 
           COUNT(*) FILTER (WHERE status = 'disputed' AND is_archived = false) as disputed_count,
           COUNT(*) FILTER (WHERE status = 'confirmed' AND is_archived = false) as confirmed_count
         FROM company_reconciliations 
         WHERE store_id = $1`,
        [storeId]
      );
      reconDisputedCount = parseInt(reconRes.rows[0]?.disputed_count || '0');
      reconConfirmedCount = parseInt(reconRes.rows[0]?.confirmed_count || '0');
    } catch (e) {}

    // 12. Teklif Onay / Ret Yanıtları (Quotations)
    let quotApprovedCount = 0;
    let quotRejectedCount = 0;
    try {
      const quotRes = await pool.query(
        `SELECT 
           COUNT(*) FILTER (WHERE customer_response_status = 'approved' OR (status = 'approved' AND (notes LIKE '%Customer Note%' OR notes LIKE '%Müşteri%'))) as approved_count,
           COUNT(*) FILTER (WHERE customer_response_status = 'rejected' OR (status = 'cancelled' AND notes LIKE '%Customer Note (Reject)%')) as rejected_count
         FROM quotations 
         WHERE store_id = $1`,
        [storeId]
      );
      quotApprovedCount = parseInt(quotRes.rows[0]?.approved_count || '0');
      quotRejectedCount = parseInt(quotRes.rows[0]?.rejected_count || '0');
    } catch (e) {}

    res.json({
      transfers: parseInt(transfersCount.rows[0].count),
      service: parseInt(serviceCount.rows[0].count),
      quotations: parseInt(quotationsCount.rows[0].count),
      sales: parseInt(salesCount.rows[0].count),
      marketplace_pending: parseInt(marketplacePendingCount.rows[0].count),
      cancelled_orders: parseInt(cancelledOrdersCount.rows[0].count),
      web_sales: parseInt(webSalesCount.rows[0].count),
      hotel_reservations: hotelReservationsCount,
      fleet: parseInt(expiringDocsCount.rows[0].count) + parseInt(maintenanceDueCount.rows[0].count),
      sales_invoices: parseInt(salesInvoicesCount.rows[0].count),
      sales_invoices_not_sent: parseInt(salesInvoicesNotSentCount.rows[0].count),
      purchase_invoices: parseInt(purchaseInvoicesCount.rows[0].count),
      critical_stock: parseInt(criticalStockCount.rows[0].count),
      crm_leads: crmLeadsCount,
      reconciliations_disputed: reconDisputedCount,
      reconciliations_confirmed: reconConfirmedCount,
      reconciliations_total: reconDisputedCount + reconConfirmedCount,
      quotations_approved: quotApprovedCount,
      quotations_rejected: quotRejectedCount,
      quotations_action: quotApprovedCount + quotRejectedCount
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

router.get("/feed", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const feed: any[] = [];
    const nowIso = new Date().toISOString();

    // 1. GİB Hatası & Reddedilen Faturalar (Critical)
    const errInvoices = await pool.query(
      `SELECT id, invoice_number, customer_name, total_amount, currency, integration_status, integration_message, created_at 
       FROM sales_invoices 
       WHERE store_id = $1 AND integration_status IN ('REJECTED', 'Hata', 'İptal', 'İptal Edildi', 'Hatalı', 'CANCELLED')
       ORDER BY created_at DESC LIMIT 5`,
      [storeId]
    );
    if (errInvoices.rows.length > 0) {
      feed.push({
        id: "gib-errors",
        category: "gib",
        severity: "critical",
        title: "GİB Hata / Reddedilen Faturalar",
        description: `${errInvoices.rows.length} faturada GİB entegrasyonu hata verdi veya alıcı tarafından reddedildi. Düzeltilip tekrar gönderilmeyi bekliyor.`,
        count: errInvoices.rows.length,
        timestamp: errInvoices.rows[0].created_at || nowIso,
        targetTab: "sales_invoices",
        targetFilter: "rejected",
        actionText: "Hatalı Faturaları İncele",
        items: errInvoices.rows.map(r => ({
          id: r.id,
          label: `${r.invoice_number} - ${r.customer_name || 'Müşteri'}`,
          detail: r.integration_message || r.integration_status
        }))
      });
    }

    // 2. İptal Edilen Web & E-Market Siparişleri (Warning)
    try {
      const cancelledOrders = await pool.query(
        `SELECT id, total_amount, currency, customer_name, source, created_at 
         FROM sales 
         WHERE store_id = $1 
           AND status = 'cancelled'
           AND (source IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti') OR notes LIKE '%Web Siparişi%')
         ORDER BY created_at DESC LIMIT 5`,
        [storeId]
      );
      if (cancelledOrders.rows.length > 0) {
        feed.push({
          id: "cancelled-orders",
          category: "order",
          severity: "warning",
          title: "İptal Edilen Web & Pazaryeri Siparişleri",
          description: `${cancelledOrders.rows.length} adet web veya pazaryeri siparişi müşteri veya platform tarafından iptal edildi.`,
          count: cancelledOrders.rows.length,
          timestamp: cancelledOrders.rows[0].created_at || nowIso,
          targetTab: "pos",
          targetFilter: "cancelled",
          actionText: "İptalleri İncele",
          items: cancelledOrders.rows.map(r => ({
            id: r.id,
            label: `#${r.id} - ${r.customer_name || 'Müşteri'} (${r.source || 'Web'})`,
            detail: `${Number(r.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${r.currency || 'TRY'}`
          }))
        });
      }
    } catch (e) {}

    // 3. Cari Mutabakat Uyuşmazlığı (Critical - Action Required)
    try {
      const disputedRecons = await pool.query(
        `SELECT id, company_id, company_title, balance, currency, dispute_note, responder_name, responded_at, created_at
         FROM company_reconciliations 
         WHERE store_id = $1 AND status = 'disputed' AND is_archived = false
         ORDER BY COALESCE(responded_at, updated_at, created_at) DESC LIMIT 5`,
        [storeId]
      );
      if (disputedRecons.rows.length > 0) {
        feed.push({
          id: "reconciliation-disputed",
          category: "reconciliation",
          severity: "critical",
          title: "Cari Mutabakat Uyuşmazlığı (İtiraz Bildirimi)",
          description: `${disputedRecons.rows.length} cari hesap dijital bakiye / BA-BS mutabakatınıza itiraz bildirdi. Müşterinin eklediği itiraz gerekçesini ve bakiye farkını inceleyiniz.`,
          count: disputedRecons.rows.length,
          timestamp: disputedRecons.rows[0].responded_at || disputedRecons.rows[0].created_at || nowIso,
          targetTab: "companies",
          targetFilter: "disputed",
          actionText: "Uyuşmazlıkları İncele",
          items: disputedRecons.rows.map(r => ({
            id: r.id,
            label: `${r.company_title || 'Cari Hesap'} (${Number(r.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${r.currency || 'TRY'})`,
            detail: r.dispute_note ? `İtiraz: ${String(r.dispute_note).slice(0, 45)}` : 'Uyuşmazlık bildirildi'
          }))
        });
      }
    } catch (e) {}

    // 3. Müşteri Tarafından Reddedilen Teklifler (Warning / Follow-up Required)
    try {
      const rejectedQuotes = await pool.query(
        `SELECT id, customer_name, customer_title, total_amount, currency, notes, customer_response_note, COALESCE(customer_response_at, created_at) as event_time
         FROM quotations 
         WHERE store_id = $1 
           AND (customer_response_status = 'rejected' OR (status = 'cancelled' AND notes LIKE '%Customer Note (Reject)%'))
         ORDER BY event_time DESC LIMIT 5`,
        [storeId]
      );
      if (rejectedQuotes.rows.length > 0) {
        feed.push({
          id: "quotations-rejected",
          category: "quotation",
          severity: "warning",
          title: "Müşteri Tarafından Reddedilen Teklifler",
          description: `${rejectedQuotes.rows.length} adet teklif müşteri tarafından reddedildi. Müşterinin ret gerekçesini inceleyip revize teklif oluşturabilirsiniz.`,
          count: rejectedQuotes.rows.length,
          timestamp: rejectedQuotes.rows[0].event_time || nowIso,
          targetTab: "quotations",
          targetFilter: "cancelled",
          actionText: "Reddedilen Teklifleri Gör",
          items: rejectedQuotes.rows.map(r => ({
            id: r.id,
            label: `Teklif #${r.id} - ${r.customer_name || 'Müşteri'}`,
            detail: r.customer_response_note 
              ? `Ret Notu: ${String(r.customer_response_note).slice(0, 35)}` 
              : `${Number(r.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${r.currency || 'TRY'}`
          }))
        });
      }
    } catch (e) {}

    // 4. Müşteri Tarafından Onaylanan Teklifler (Success / Positive Pulse)
    try {
      const approvedQuotes = await pool.query(
        `SELECT id, customer_name, customer_title, total_amount, currency, notes, customer_response_note, COALESCE(customer_response_at, created_at) as event_time
         FROM quotations 
         WHERE store_id = $1 
           AND (customer_response_status = 'approved' OR (status = 'approved' AND (notes LIKE '%Customer Note%' OR notes LIKE '%Müşteri%')))
         ORDER BY event_time DESC LIMIT 5`,
        [storeId]
      );
      if (approvedQuotes.rows.length > 0) {
        feed.push({
          id: "quotations-approved",
          category: "quotation",
          severity: "info",
          title: "Müşteri Tarafından Onaylanan Teklifler",
          description: `${approvedQuotes.rows.length} adet teklif müşteri tarafından online onaylandı ve sipariş/satış kaydına dönüştürüldü.`,
          count: approvedQuotes.rows.length,
          timestamp: approvedQuotes.rows[0].event_time || nowIso,
          targetTab: "quotations",
          targetFilter: "approved",
          actionText: "Onaylı Teklifleri Gör",
          items: approvedQuotes.rows.map(r => ({
            id: r.id,
            label: `Teklif #${r.id} - ${r.customer_name || 'Müşteri'}`,
            detail: `${Number(r.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${r.currency || 'TRY'}`
          }))
        });
      }
    } catch (e) {}

    // 5. Onaylanan Dijital Cari Mutabakatlar (Success / Document Archive)
    try {
      const confirmedRecons = await pool.query(
        `SELECT id, company_id, company_title, balance, currency, responder_name, responded_at, created_at
         FROM company_reconciliations 
         WHERE store_id = $1 AND status = 'confirmed' AND is_archived = false
         ORDER BY COALESCE(responded_at, updated_at, created_at) DESC LIMIT 5`,
        [storeId]
      );
      if (confirmedRecons.rows.length > 0) {
        feed.push({
          id: "reconciliation-confirmed",
          category: "reconciliation",
          severity: "info",
          title: "Onaylanan Dijital Cari Mutabakatlar",
          description: `${confirmedRecons.rows.length} cari hesap resmi bakiye ve BA/BS mutabakat mektubunu onayladı. Tamamlanan evrakları cari arşivine aktarabilirsiniz.`,
          count: confirmedRecons.rows.length,
          timestamp: confirmedRecons.rows[0].responded_at || confirmedRecons.rows[0].created_at || nowIso,
          targetTab: "companies",
          targetFilter: "confirmed",
          actionText: "Onaylı Mutabakatlara Git",
          items: confirmedRecons.rows.map(r => ({
            id: r.id,
            label: `${r.company_title || 'Cari Hesap'}`,
            detail: `${Number(r.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${r.currency || 'TRY'} ${r.responder_name ? `• ${r.responder_name}` : ''}`
          }))
        });
      }
    } catch (e) {}

    // 6. GİB'e Gönderilmemiş Faturalar (Warning / Action Required)
    const unsentInvoices = await pool.query(
      `SELECT id, invoice_number, customer_name, grand_total, currency, created_at 
       FROM sales_invoices 
       WHERE store_id = $1 
         AND status NOT IN ('cancelled', 'iptal')
         AND (integration_status IS NULL OR integration_status IN ('', 'NOT_SENT', 'DRAFT', 'UNKNOWN', 'BILINMIYOR'))
         AND (ettn IS NULL OR length(trim(ettn)) < 5)
       ORDER BY created_at DESC LIMIT 5`,
      [storeId]
    );
    const unsentCountRes = await pool.query(
      `SELECT COUNT(*) FROM sales_invoices 
       WHERE store_id = $1 
         AND status NOT IN ('cancelled', 'iptal')
         AND (integration_status IS NULL OR integration_status IN ('', 'NOT_SENT', 'DRAFT', 'UNKNOWN', 'BILINMIYOR'))
         AND (ettn IS NULL OR length(trim(ettn)) < 5)`,
      [storeId]
    );
    const totalUnsent = parseInt(unsentCountRes.rows[0]?.count || '0');
    if (totalUnsent > 0) {
      feed.push({
        id: "gib-unsent",
        category: "gib",
        severity: "warning",
        title: "GİB'e Gönderilmeyi Bekleyen Faturalar",
        description: `${totalUnsent} onaylı satış faturası henüz resmi GİB e-Fatura / e-Arşiv sistemine iletilmedi. Resmi geçerlilik için gönderilmesi gerekir.`,
        count: totalUnsent,
        timestamp: unsentInvoices.rows[0]?.created_at || nowIso,
        targetTab: "sales_invoices",
        targetFilter: "not_sent",
        actionText: "Gönderilmeyen Faturalara Git",
        items: unsentInvoices.rows.map(r => ({
          id: r.id,
          label: `${r.invoice_number || 'Fatura'} - ${r.customer_name || 'Müşteri'}`,
          detail: `${Number(r.grand_total || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${r.currency || 'TRY'}`
        }))
      });
    }

    // 3. Yeni Web Siparişleri (Action Required)
    const webSales = await pool.query(
      `SELECT id, total_amount, currency, customer_name, payment_method, created_at 
       FROM sales 
       WHERE store_id = $1 
         AND status IN ('pending', 'processing', 'preparing') 
         AND (payment_method IN ('iyzico', 'credit_card', 'bank_transfer', 'cash_on_delivery', 'paypal', 'payoneer', 'store_reservation') OR notes LIKE '%E-posta:%' OR notes LIKE '%Web Siparişi%')
       ORDER BY created_at DESC LIMIT 5`,
      [storeId]
    );
    if (webSales.rows.length > 0) {
      feed.push({
        id: "web-orders",
        category: "order",
        severity: "critical",
        title: "Yeni E-Ticaret Web Siparişleri",
        description: `${webSales.rows.length} yeni online sipariş onay ve kargoya hazırlık aşamasında bekliyor.`,
        count: webSales.rows.length,
        timestamp: webSales.rows[0].created_at || nowIso,
        targetTab: "pos",
        targetFilter: "web",
        actionText: "Siparişleri Yönet (POS)",
        items: webSales.rows.map(r => ({
          id: r.id,
          label: `#${r.id} - ${r.customer_name || 'Müşteri'}`,
          detail: `${Number(r.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${r.currency || 'TRY'} (${r.payment_method})`
        }))
      });
    }

    // 4. Yeni Otel Rezervasyonları (hotelLP)
    try {
      const hotelRes = await pool.query(
        `SELECT id, guest_name, check_in_date, check_out_date, total_price, currency, created_at 
         FROM hotel_reservations 
         WHERE store_id = $1 AND status = 'pending_action'
         ORDER BY created_at DESC LIMIT 5`,
        [storeId]
      );
      if (hotelRes.rows.length > 0) {
        feed.push({
          id: "hotel-reservations",
          category: "hotel",
          severity: "warning",
          title: "Yeni Otel Oda Rezervasyonu",
          description: `${hotelRes.rows.length} misafir rezervasyonu oda ataması ve check-in onayı bekliyor.`,
          count: hotelRes.rows.length,
          timestamp: hotelRes.rows[0].created_at || nowIso,
          targetTab: "hotel-rooms",
          actionText: "Rezervasyonları Aç",
          items: hotelRes.rows.map(r => ({
            id: r.id,
            label: `${r.guest_name || 'Misafir'}`,
            detail: `${r.check_in_date} → ${r.check_out_date} (${Number(r.total_price || 0).toLocaleString('tr-TR')} ${r.currency || 'TRY'})`
          }))
        });
      }
    } catch (e) {}

    // 5. Kritik & Tükenen Stoklar (Stock Alarm)
    const lowStock = await pool.query(
      `SELECT id, name, barcode, stock_quantity, min_stock_level, price, currency 
       FROM products 
       WHERE store_id = $1 
         AND (stock_quantity <= COALESCE(min_stock_level, 0) OR stock_quantity <= 0)
       ORDER BY stock_quantity ASC LIMIT 5`,
      [storeId]
    );
    const lowStockCountRes = await pool.query(
      `SELECT COUNT(*) FROM products 
       WHERE store_id = $1 
         AND (stock_quantity <= COALESCE(min_stock_level, 0) OR stock_quantity <= 0)`,
      [storeId]
    );
    const totalLowStock = parseInt(lowStockCountRes.rows[0]?.count || '0');
    if (totalLowStock > 0) {
      feed.push({
        id: "low-stock",
        category: "stock",
        severity: "warning",
        title: "Kritik & Tükenen Stok Seviyesi",
        description: `${totalLowStock} ürün asgari stok limitinin altına düştü veya tükendi. Pazar yerlerindeki satışların kesilmemesi için stok ikmali yapınız.`,
        count: totalLowStock,
        timestamp: nowIso,
        targetTab: "products",
        actionText: "Envanter ve Stokları Düzenle",
        items: lowStock.rows.map(r => ({
          id: r.id,
          label: r.name,
          detail: `Mevcut Stok: ${r.stock_quantity} (Min: ${r.min_stock_level || 0})`
        }))
      });
    }

    // 6. Gelen Okunmamış Alış Faturaları (Supplier Invoices)
    const unreadPurchase = await pool.query(
      `SELECT id, invoice_number, supplier_name, total_amount, currency, invoice_date 
       FROM purchase_invoices 
       WHERE store_id = $1 AND is_read = false
       ORDER BY invoice_date DESC LIMIT 5`,
      [storeId]
    );
    if (unreadPurchase.rows.length > 0) {
      feed.push({
        id: "unread-purchase-invoices",
        category: "invoice",
        severity: "info",
        title: "Yeni Gelen Tedarikçi Faturaları",
        description: `${unreadPurchase.rows.length} yeni e-Fatura tedarikçinizden ulaştı. Kalemleri kontrol edip stoğa kabul edebilirsiniz.`,
        count: unreadPurchase.rows.length,
        timestamp: unreadPurchase.rows[0].invoice_date || nowIso,
        targetTab: "purchase_invoices",
        actionText: "Alış Faturalarını İncele",
        items: unreadPurchase.rows.map(r => ({
          id: r.id,
          label: `${r.invoice_number || 'Alış Faturası'} - ${r.supplier_name || 'Tedarikçi'}`,
          detail: `${Number(r.total_amount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ${r.currency || 'TRY'}`
        }))
      });
    }

    // 7. Şubeler Arası Stok Transferi
    const transfers = await pool.query(
      `SELECT id, transfer_number, status, created_at 
       FROM stock_transfers 
       WHERE (to_store_id = $1 AND status = 'shipped')
          OR (from_store_id = $1 AND status IN ('pending', 'accepted', 'preparing'))
       ORDER BY created_at DESC LIMIT 5`,
      [storeId]
    );
    if (transfers.rows.length > 0) {
      feed.push({
        id: "stock-transfers",
        category: "transfer",
        severity: "info",
        title: "Şubeler Arası Bekleyen Transferler",
        description: `${transfers.rows.length} adet stok transferi onay, hazırlık veya kabul aşamasında.`,
        count: transfers.rows.length,
        timestamp: transfers.rows[0].created_at || nowIso,
        targetTab: "stock_transfer",
        actionText: "Transferleri Yönet",
        items: transfers.rows.map(r => ({
          id: r.id,
          label: `Transfer #${r.id} (${r.status})`,
          detail: `Tarih: ${new Date(r.created_at).toLocaleDateString('tr-TR')}`
        }))
      });
    }

    // 8. Teknik Servis Kayıtları
    const serviceRecords = await pool.query(
      `SELECT id, customer_name, device_model, status, created_at 
       FROM service_records 
       WHERE store_id = $1 AND status = 'received'
       ORDER BY created_at DESC LIMIT 5`,
      [storeId]
    );
    if (serviceRecords.rows.length > 0) {
      feed.push({
        id: "service-records",
        category: "service",
        severity: "info",
        title: "İşlem Bekleyen Teknik Servis Cihazları",
        description: `${serviceRecords.rows.length} cihaz teslim alındı, teşhis ve onarım sırası bekliyor.`,
        count: serviceRecords.rows.length,
        timestamp: serviceRecords.rows[0].created_at || nowIso,
        targetTab: "service",
        actionText: "Servis Masasına Git",
        items: serviceRecords.rows.map(r => ({
          id: r.id,
          label: `${r.device_model || 'Cihaz'} - ${r.customer_name || 'Müşteri'}`,
          detail: `Kayıt: #${r.id}`
        }))
      });
    }

    // 9. Araç Muayene & Periyodik Bakım (Oto Galeri / Filo)
    const expiringDocs = await pool.query(
      `SELECT v.id as vehicle_id, v.brand, v.model, v.plate, vd.document_type, vd.expiry_date 
       FROM vehicle_documents vd
       JOIN vehicles v ON vd.vehicle_id = v.id
       WHERE v.store_id = $1 AND vd.expiry_date <= CURRENT_DATE + INTERVAL '30 days' AND vd.expiry_date >= CURRENT_DATE
       ORDER BY vd.expiry_date ASC LIMIT 5`,
      [storeId]
    );
    if (expiringDocs.rows.length > 0) {
      feed.push({
        id: "fleet-docs",
        category: "fleet",
        severity: "warning",
        title: "Araç Muayene & Sigorta Evrak Hatırlatması",
        description: `${expiringDocs.rows.length} aracın resmi evrak veya sigorta süresi 30 gün içinde sona eriyor.`,
        count: expiringDocs.rows.length,
        timestamp: nowIso,
        targetTab: "fleet",
        actionText: "Filo / Araçları İncele",
        items: expiringDocs.rows.map(r => ({
          id: r.vehicle_id,
          label: `${r.plate || ''} ${r.brand} ${r.model}`,
          detail: `${r.document_type}: ${new Date(r.expiry_date).toLocaleDateString('tr-TR')}`
        }))
      });
    }

    // 10. Web Portföy & CRM Müşteri Talepleri (Emlak / Oto)
    try {
      const leads = await pool.query(
        `SELECT id, name, phone, email, notes, created_at 
         FROM real_estate_contacts 
         WHERE store_id = $1 
         ORDER BY created_at DESC LIMIT 5`,
        [storeId]
      );
      if (leads.rows.length > 0) {
        feed.push({
          id: "crm-contacts",
          category: "crm",
          severity: "info",
          title: "Yeni Müşteri & Portföy Başvuruları",
          description: `${leads.rows.length} yeni müşteri web siteniz üzerinden iletişim/başvuru formu doldurdu.`,
          count: leads.rows.length,
          timestamp: leads.rows[0].created_at || nowIso,
          targetTab: "real_estate_crm",
          actionText: "CRM Taleplerini Gör",
          items: leads.rows.map(r => ({
            id: r.id,
            label: `${r.name || 'Müşteri'} (${r.phone || r.email || '-'})`,
            detail: r.notes ? String(r.notes).slice(0, 50) : 'Başvuru alındı'
          }))
        });
      }
    } catch (e) {}

    res.json(feed);
  } catch (error: any) {
    console.error("Notifications feed error:", error);
    res.status(500).json({ error: "Failed to generate notifications feed" });
  }
});

router.get("/list", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  try {
    const result = await pool.query(
      "SELECT * FROM notifications WHERE store_id = $1 ORDER BY created_at DESC LIMIT 50",
      [storeId]
    );
    res.json(result.rows);
  } catch (e: any) {
    res.json([]);
  }
});

export default router;
