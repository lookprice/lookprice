import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

const resolveMarketplaceLabel = (row: any): string => {
  const src = String(row.source || "").toLowerCase();
  const pm = String(row.payment_method || "").toLowerCase();
  const invNo = String(row.invoice_number || "").toUpperCase();
  const notes = String(row.notes || "").toLowerCase();

  if (src.includes("trendyol") || pm.includes("trendyol") || invNo.startsWith("TY-") || notes.includes("trendyol")) return "Trendyol";
  if (src.includes("hepsiburada") || pm.includes("hepsiburada") || invNo.startsWith("HB-") || notes.includes("hepsiburada")) return "Hepsiburada";
  if (src.includes("amazon") || pm.includes("amazon") || invNo.startsWith("AMZ-") || notes.includes("amazon")) return "Amazon";
  if (src.includes("n11") || pm.includes("n11") || invNo.startsWith("N11-") || notes.includes("n11")) return "N11";
  if (src.includes("pazarama") || pm.includes("pazarama") || invNo.startsWith("PZR-") || notes.includes("pazarama")) return "Pazarama";
  if (src.includes("ciceksepeti") || pm.includes("ciceksepeti") || notes.includes("çiçeksepeti")) return "Çiçeksepeti";
  return "Pazaryeri";
};

// --- Notifications & Alerts ---

router.get("/", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    // Fetch store info first
    const storeRes = await pool.query("SELECT store_type, branding, einvoice_settings FROM stores WHERE id = $1", [storeId]);
    const storeRow = storeRes.rows[0] || { store_type: "product", branding: {}, einvoice_settings: {} };
    const sector = (storeRow.store_type || storeRow.branding?.store_type || storeRow.branding?.page_layout_settings?.sector || "product").toUpperCase();
    const branding = storeRow.branding || {};
    const einvoiceSettings = storeRow.einvoice_settings || {};
    const isEInvoiceActive = Boolean(einvoiceSettings.is_active && einvoiceSettings.provider && einvoiceSettings.provider !== 'none');
    const isHotelModuleActive = branding?.hotel_module_enabled === true;
    const isPortfolio = ["REAL_ESTATE", "AUTOMOTIVE", "MOTOR_VEHICLE", "PORTFOLIO", "AUTO", "AUTOLP", "GALERI", "OTO", "EMLAK"].includes(sector);
    const isCafeRestaurant = sector === "HORECA" || sector === "CAFE_RESTAURANT";
    const isShopLp = !isPortfolio && !isCafeRestaurant;

    let transfers = 0;
    try {
      const transfersCount = await pool.query(
        `SELECT COUNT(*) FROM stock_transfers 
         WHERE (to_store_id = $1 AND status = 'shipped')
            OR (from_store_id = $1 AND status IN ('pending', 'accepted', 'preparing'))`,
        [storeId]
      );
      transfers = parseInt(transfersCount.rows[0]?.count || "0");
    } catch (e) {}

    let service = 0;
    try {
      if (!isCafeRestaurant && !isPortfolio) {
        const serviceCount = await pool.query(
          "SELECT COUNT(*) FROM service_records WHERE store_id = $1 AND status IN ('received', 'diagnosing', 'waiting_approval')",
          [storeId]
        );
        service = parseInt(serviceCount.rows[0]?.count || "0");
      }
    } catch (e) {}

    let quotations = 0;
    try {
      const quotationsCount = await pool.query(
        "SELECT COUNT(*) FROM quotations WHERE store_id = $1 AND status = 'pending'",
        [storeId]
      );
      quotations = parseInt(quotationsCount.rows[0]?.count || "0");
    } catch (e) {}

    let sales = 0;
    try {
      const salesCount = await pool.query(
        `SELECT COUNT(*) FROM sales 
         WHERE store_id = $1 
           AND status IN ('pending', 'processing', 'preparing')`,
        [storeId]
      );
      sales = parseInt(salesCount.rows[0]?.count || "0");
    } catch (e) {}

    let marketplacePending = 0;
    try {
      if (isShopLp) {
        const mpSalesCount = await pool.query(
          `SELECT COUNT(*) FROM sales 
           WHERE store_id = $1 
             AND status IN ('pending', 'processing', 'preparing')
             AND (
               source IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti')
               OR LOWER(COALESCE(payment_method, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama|marketplace)%'
               OR LOWER(COALESCE(notes, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama)%'
             )`,
          [storeId]
        );
        const mpUnsentInvoicesCount = await pool.query(
          `SELECT COUNT(*) FROM sales_invoices
           WHERE store_id = $1
             AND status NOT IN ('cancelled', 'iptal')
             AND (
               invoice_type = 'marketplace'
               OR invoice_number ~* '^(TY-|HB-|AMZ-|N11-|PZR-)'
               OR LOWER(COALESCE(payment_method, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama)%'
             )
             AND (integration_status IS NULL OR integration_status IN ('', 'NOT_SENT', 'DRAFT', 'UNKNOWN', 'BILINMIYOR'))
             AND (ettn IS NULL OR length(trim(ettn)) < 5)`,
          [storeId]
        );
        marketplacePending = parseInt(mpSalesCount.rows[0]?.count || "0") + parseInt(mpUnsentInvoicesCount.rows[0]?.count || "0");
      }
    } catch (e) {}

    let cancelledOrders = 0;
    try {
      const cancelledOrdersCount = await pool.query(
        `SELECT COUNT(*) FROM sales 
         WHERE store_id = $1 
           AND status = 'cancelled'
           AND (
             source IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti')
             OR LOWER(COALESCE(payment_method, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama|marketplace)%'
             OR notes LIKE '%Web Siparişi%'
           )`,
        [storeId]
      );
      cancelledOrders = parseInt(cancelledOrdersCount.rows[0]?.count || "0");
    } catch (e) {}

    let webSales = 0;
    try {
      const webSalesCount = await pool.query(
        `SELECT COUNT(*) FROM sales 
         WHERE store_id = $1 
           AND status IN ('pending', 'processing', 'preparing') 
           AND (
             payment_method IN ('iyzico', 'credit_card', 'bank_transfer', 'cash_on_delivery', 'paypal', 'payoneer', 'store_reservation', 'online', 'web')
             OR source IN ('web', 'store')
             OR notes LIKE '%E-posta:%'
             OR notes LIKE '%Web Siparişi%'
           )
           AND COALESCE(source, '') NOT IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti')`,
        [storeId]
      );
      webSales = parseInt(webSalesCount.rows[0]?.count || "0");
    } catch (e) {}

    let fleetCount = 0;
    try {
      const expiringDocsCount = await pool.query(
        `SELECT COUNT(*) FROM vehicle_documents vd
         JOIN vehicles v ON vd.vehicle_id = v.id
         WHERE v.store_id = $1 AND vd.expiry_date <= CURRENT_DATE + INTERVAL '30 days'`,
        [storeId]
      );
      const maintenanceDueCount = await pool.query(
        `SELECT COUNT(*) FROM vehicle_maintenance vm
         JOIN vehicles v ON vm.vehicle_id = v.id
         WHERE v.store_id = $1 
           AND vm.status IN ('planned', 'scheduled')
           AND (vm.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days' OR (v.current_mileage >= vm.next_maintenance_mileage - 1000 AND vm.next_maintenance_mileage > 0))`,
        [storeId]
      );
      fleetCount = parseInt(expiringDocsCount.rows[0]?.count || "0") + parseInt(maintenanceDueCount.rows[0]?.count || "0");
    } catch (e) {}

    let salesInvoicesErrorCount = 0;
    let salesInvoicesNotSentCount = 0;
    try {
      if (!isPortfolio && isEInvoiceActive) {
        const salesInvoicesCount = await pool.query(
          `SELECT COUNT(*) FROM sales_invoices 
           WHERE store_id = $1 
             AND COALESCE(invoice_type, '') NOT IN ('receipt', 'pos_receipt')
             AND COALESCE(notes, '') NOT LIKE '%Hızlı POS%'
             AND COALESCE(NULLIF(TRIM(customer_name), ''), '') != 'Hızlı Satış'
             AND integration_status IN ('REJECTED', 'Hata', 'İptal', 'İptal Edildi', 'Hatalı', 'CANCELLED', 'ERROR')`,
          [storeId]
        );
        salesInvoicesErrorCount = parseInt(salesInvoicesCount.rows[0]?.count || "0");

        const notSentRes = await pool.query(
          `SELECT COUNT(*) FROM sales_invoices 
           WHERE store_id = $1 
             AND status NOT IN ('cancelled', 'iptal')
             AND COALESCE(invoice_type, '') NOT IN ('receipt', 'pos_receipt')
             AND COALESCE(notes, '') NOT LIKE '%Hızlı POS%'
             AND COALESCE(NULLIF(TRIM(customer_name), ''), '') != 'Hızlı Satış'
             AND (integration_status IS NULL OR integration_status IN ('', 'NOT_SENT', 'DRAFT', 'UNKNOWN', 'BILINMIYOR'))
             AND (ettn IS NULL OR length(trim(ettn)) < 5)`,
          [storeId]
        );
        salesInvoicesNotSentCount = parseInt(notSentRes.rows[0]?.count || "0");
      }
    } catch (e) {}

    let purchaseInvoicesPendingCount = 0;
    try {
      if (!isPortfolio) {
        const purchaseInvoicesCount = await pool.query(
          `SELECT COUNT(*) FROM purchase_invoices 
           WHERE store_id = $1 AND status = 'pending'`,
          [storeId]
        );
        purchaseInvoicesPendingCount = parseInt(purchaseInvoicesCount.rows[0]?.count || "0");
      }
    } catch (e) {}

    let criticalStock = 0;
    try {
      if (!isPortfolio) {
        const criticalStockCount = await pool.query(
          `SELECT COUNT(*) FROM products 
           WHERE store_id = $1 
             AND (stock_quantity <= COALESCE(min_stock_level, 0) OR stock_quantity <= 0)`,
          [storeId]
        );
        criticalStock = parseInt(criticalStockCount.rows[0]?.count || "0");
      }
    } catch (e) {}

    let crmLeadsCount = 0;
    try {
      if (isPortfolio) {
        const crmRes = await pool.query(
          "SELECT COUNT(*) FROM real_estate_contacts WHERE store_id = $1 AND created_at >= NOW() - INTERVAL '30 days'",
          [storeId]
        );
        crmLeadsCount = parseInt(crmRes.rows[0]?.count || "0");
      }
    } catch (e) {}

    let hotelReservationsCount = 0;
    try {
      if (isHotelModuleActive) {
        const hotelRes = await pool.query(
          "SELECT COUNT(*) FROM hotel_reservations WHERE store_id = $1 AND status = 'pending_action'",
          [storeId]
        );
        hotelReservationsCount = parseInt(hotelRes.rows[0]?.count || "0");
      }
    } catch (err) {}

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
      reconDisputedCount = parseInt(reconRes.rows[0]?.disputed_count || "0");
      reconConfirmedCount = parseInt(reconRes.rows[0]?.confirmed_count || "0");
    } catch (e) {}

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
      quotApprovedCount = parseInt(quotRes.rows[0]?.approved_count || "0");
      quotRejectedCount = parseInt(quotRes.rows[0]?.rejected_count || "0");
    } catch (e) {}

    res.json({
      transfers,
      service,
      quotations,
      sales,
      marketplace_pending: marketplacePending,
      cancelled_orders: cancelledOrders,
      web_sales: webSales,
      hotel_reservations: hotelReservationsCount,
      fleet: fleetCount,
      sales_invoices: salesInvoicesErrorCount,
      sales_invoices_not_sent: salesInvoicesNotSentCount,
      purchase_invoices: purchaseInvoicesPendingCount,
      critical_stock: criticalStock,
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

    // Fetch store sector & branding for strict sectoral isolation (Rule 0 & Rule 5)
    const storeRes = await pool.query("SELECT store_type, branding, einvoice_settings FROM stores WHERE id = $1", [storeId]);
    const storeRow = storeRes.rows[0] || { store_type: "product", branding: {}, einvoice_settings: {} };
    const sector = (storeRow.store_type || storeRow.branding?.store_type || storeRow.branding?.page_layout_settings?.sector || "product").toUpperCase();
    const branding = storeRow.branding || {};
    const einvoiceSettings = storeRow.einvoice_settings || {};
    const isEInvoiceActive = Boolean(einvoiceSettings.is_active && einvoiceSettings.provider && einvoiceSettings.provider !== 'none');
    const isHotelModuleActive = branding?.hotel_module_enabled === true;
    const isPortfolio = ["REAL_ESTATE", "AUTOMOTIVE", "MOTOR_VEHICLE", "PORTFOLIO", "AUTO", "AUTOLP", "GALERI", "OTO", "EMLAK"].includes(sector);
    const isCafeRestaurant = sector === "HORECA" || sector === "CAFE_RESTAURANT";
    const isShopLp = !isPortfolio && !isCafeRestaurant;

    // 1. E-Market (Pazaryeri) Siparişleri & Faturalandırılacak Pazaryeri Satışları (Strictly shopLP only)
    if (isShopLp) {
      try {
        const mpSalesRes = await pool.query(
          `SELECT id, total_amount, currency, customer_name, source, payment_method, notes, status, created_at
           FROM sales
           WHERE store_id = $1
             AND status IN ('pending', 'processing', 'preparing')
             AND (
               source IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti')
               OR LOWER(COALESCE(payment_method, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama|marketplace)%'
               OR LOWER(COALESCE(notes, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama)%'
             )
           ORDER BY created_at DESC LIMIT 10`,
          [storeId]
        );

        const mpSalesCountRes = await pool.query(
          `SELECT COUNT(*) FROM sales
           WHERE store_id = $1
             AND status IN ('pending', 'processing', 'preparing')
             AND (
               source IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti')
               OR LOWER(COALESCE(payment_method, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama|marketplace)%'
               OR LOWER(COALESCE(notes, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama)%'
             )`,
          [storeId]
        );

        const mpInvoicesRes = await pool.query(
          `SELECT si.id, si.invoice_number,
                  COALESCE(c.title, cust.name, 'Pazaryeri Müşterisi') as customer_name,
                  COALESCE(NULLIF(si.grand_total, 0), si.total_amount, 0) as amount,
                  si.currency, si.payment_method, si.invoice_type, si.notes, si.created_at, si.invoice_date
           FROM sales_invoices si
           LEFT JOIN companies c ON si.company_id = c.id
           LEFT JOIN customers cust ON si.customer_id = cust.id
           WHERE si.store_id = $1
             AND si.status NOT IN ('cancelled', 'iptal')
             AND (
               si.invoice_type = 'marketplace'
               OR si.invoice_number ~* '^(TY-|HB-|AMZ-|N11-|PZR-)'
               OR LOWER(COALESCE(si.payment_method, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama)%'
               OR LOWER(COALESCE(si.notes, '')) SIMILAR TO '%(trendyol siparişi|hepsiburada siparişi|amazon siparişi|n11 siparişi|pazarama siparişi)%'
             )
             AND (si.integration_status IS NULL OR si.integration_status IN ('', 'NOT_SENT', 'DRAFT', 'UNKNOWN', 'BILINMIYOR'))
             AND (si.ettn IS NULL OR length(trim(si.ettn)) < 5)
           ORDER BY COALESCE(si.created_at, si.invoice_date::timestamp) DESC LIMIT 10`,
          [storeId]
        );

        const mpInvoicesCountRes = await pool.query(
          `SELECT COUNT(*) FROM sales_invoices si
           WHERE si.store_id = $1
             AND si.status NOT IN ('cancelled', 'iptal')
             AND (
               si.invoice_type = 'marketplace'
               OR si.invoice_number ~* '^(TY-|HB-|AMZ-|N11-|PZR-)'
               OR LOWER(COALESCE(si.payment_method, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama)%'
               OR LOWER(COALESCE(si.notes, '')) SIMILAR TO '%(trendyol siparişi|hepsiburada siparişi|amazon siparişi|n11 siparişi|pazarama siparişi)%'
             )
             AND (si.integration_status IS NULL OR si.integration_status IN ('', 'NOT_SENT', 'DRAFT', 'UNKNOWN', 'BILINMIYOR'))
             AND (si.ettn IS NULL OR length(trim(si.ettn)) < 5)`,
          [storeId]
        );

        const pendingSalesTotal = parseInt(mpSalesCountRes.rows[0]?.count || "0");
        const unsentMpInvTotal = parseInt(mpInvoicesCountRes.rows[0]?.count || "0");
        const combinedTotal = pendingSalesTotal + unsentMpInvTotal;

        if (combinedTotal > 0) {
          const previewItems: Array<{ id: string | number; label: string; detail?: string }> = [];

          for (const inv of mpInvoicesRes.rows) {
            if (previewItems.length >= 6) break;
            const mpName = resolveMarketplaceLabel(inv);
            previewItems.push({
              id: `mp_inv_${inv.id}`,
              label: `[${mpName}] ${inv.invoice_number || `#${inv.id}`} - ${inv.customer_name}`,
              detail: `${Number(inv.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${inv.currency || "TRY"} • Fatura Bekliyor`
            });
          }

          for (const s of mpSalesRes.rows) {
            if (previewItems.length >= 6) break;
            const mpName = resolveMarketplaceLabel(s);
            previewItems.push({
              id: `mp_sale_${s.id}`,
              label: `[${mpName}] Sipariş #${s.id} - ${s.customer_name || "Müşteri"}`,
              detail: `${Number(s.total_amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${s.currency || "TRY"} • Hazırlık`
            });
          }

          feed.push({
            id: "marketplace-orders",
            category: "order",
            severity: "critical",
            title: "E-Market (Pazaryeri) Siparişleri & Fatura Bekleyenler",
            description: `${combinedTotal} adet pazaryeri siparişi (${unsentMpInvTotal > 0 ? `${unsentMpInvTotal} resmi e-Fatura/e-Arşiv gönderimi bekleyen` : ""}${unsentMpInvTotal > 0 && pendingSalesTotal > 0 ? ", " : ""}${pendingSalesTotal > 0 ? `${pendingSalesTotal} kargo/onay bekleyen` : ""}) işlem sırasındadır.`,
            count: combinedTotal,
            timestamp: mpInvoicesRes.rows[0]?.created_at || mpSalesRes.rows[0]?.created_at || nowIso,
            targetTab: unsentMpInvTotal > 0 ? "sales_invoices" : "pos",
            targetFilter: unsentMpInvTotal > 0 ? "not_sent" : "pending",
            actionText: unsentMpInvTotal > 0 ? "Pazaryeri Faturalarını Gönder" : "E-Market Siparişlerini Yönet",
            items: previewItems
          });
        }
      } catch (e) {
        console.warn("[Radar Feed] Marketplace orders check warning:", e);
      }
    }

    // 2. Ara Tarihli & Önceki Aydan Devreden Alış Faturaları (Backdated & Carry-Over Purchase Invoices)
    if (!isPortfolio) {
      try {
        const backdatedOrCarryOverRes = await pool.query(
          `SELECT pi.id, pi.invoice_number,
                  COALESCE(NULLIF(TRIM(pi.supplier_name), ''), c.title, 'Tedarikçi') as supplier_name,
                  COALESCE(NULLIF(pi.grand_total, 0), pi.total_amount, 0) as amount,
                  pi.currency, pi.invoice_date, pi.created_at, pi.status,
                  (DATE_TRUNC('month', pi.invoice_date::date) < DATE_TRUNC('month', CURRENT_DATE)) as is_prev_month,
                  EXISTS (
                    SELECT 1 FROM purchase_invoices pi2
                    WHERE pi2.store_id = pi.store_id
                      AND pi2.id != pi.id
                      AND pi2.invoice_date::date > pi.invoice_date::date
                      AND (
                        pi2.created_at < pi.created_at
                        OR (pi.status = 'pending' AND pi2.status IN ('approved', 'completed'))
                      )
                  ) as is_backdated
           FROM purchase_invoices pi
           LEFT JOIN companies c ON pi.company_id = c.id
           WHERE pi.store_id = $1
             AND (
               (
                 pi.status = 'pending'
                 AND (
                   DATE_TRUNC('month', pi.invoice_date::date) < DATE_TRUNC('month', CURRENT_DATE)
                   OR EXISTS (
                     SELECT 1 FROM purchase_invoices pi2
                     WHERE pi2.store_id = pi.store_id
                       AND pi2.id != pi.id
                       AND pi2.invoice_date::date > pi.invoice_date::date
                       AND (
                         pi2.created_at < pi.created_at
                         OR pi2.status IN ('approved', 'completed')
                       )
                   )
                   OR pi.invoice_date::date < CURRENT_DATE - INTERVAL '3 days'
                 )
               )
               OR (
                 DATE_TRUNC('month', pi.invoice_date::date) < DATE_TRUNC('month', CURRENT_DATE)
                 AND DATE_TRUNC('month', COALESCE(pi.created_at, CURRENT_TIMESTAMP)::date) = DATE_TRUNC('month', CURRENT_DATE)
               )
             )
           ORDER BY (CASE WHEN pi.status = 'pending' THEN 0 ELSE 1 END) ASC, pi.invoice_date ASC
           LIMIT 8`,
          [storeId]
        );

        const backdatedCountRes = await pool.query(
          `SELECT 
             COUNT(*) as total_count,
             COUNT(*) FILTER (WHERE DATE_TRUNC('month', pi.invoice_date::date) < DATE_TRUNC('month', CURRENT_DATE)) as prev_month_count,
             COUNT(*) FILTER (WHERE pi.status = 'pending') as pending_count
           FROM purchase_invoices pi
           WHERE pi.store_id = $1
             AND (
               (
                 pi.status = 'pending'
                 AND (
                   DATE_TRUNC('month', pi.invoice_date::date) < DATE_TRUNC('month', CURRENT_DATE)
                   OR EXISTS (
                     SELECT 1 FROM purchase_invoices pi2
                     WHERE pi2.store_id = pi.store_id
                       AND pi2.id != pi.id
                       AND pi2.invoice_date::date > pi.invoice_date::date
                       AND (
                         pi2.created_at < pi.created_at
                         OR pi2.status IN ('approved', 'completed')
                       )
                   )
                   OR pi.invoice_date::date < CURRENT_DATE - INTERVAL '3 days'
                 )
               )
               OR (
                 DATE_TRUNC('month', pi.invoice_date::date) < DATE_TRUNC('month', CURRENT_DATE)
                 AND DATE_TRUNC('month', COALESCE(pi.created_at, CURRENT_TIMESTAMP)::date) = DATE_TRUNC('month', CURRENT_DATE)
               )
             )`,
          [storeId]
        );

        const totalBackdated = parseInt(backdatedCountRes.rows[0]?.total_count || "0");
        const prevMonthCount = parseInt(backdatedCountRes.rows[0]?.prev_month_count || "0");
        const pendingBackdatedCount = parseInt(backdatedCountRes.rows[0]?.pending_count || "0");

        if (totalBackdated > 0) {
          const araTarihliCount = Math.max(0, totalBackdated - prevMonthCount);
          const descParts: string[] = [];
          if (prevMonthCount > 0) {
            descParts.push(`${prevMonthCount} adet önceki aydan devreden / geçmiş dönem tarihli`);
          }
          if (araTarihliCount > 0) {
            descParts.push(`${araTarihliCount} adet ara tarihli (sonradan ulaşan)`);
          }

          feed.push({
            id: "backdated-carryover-purchase-invoices",
            category: "invoice",
            severity: pendingBackdatedCount > 0 ? "critical" : "warning",
            title: "Ara Tarihli & Önceki Aydan Devreden Alış Faturaları",
            description: `Sistemde ${descParts.join(" ve ")} olmak üzere toplam ${totalBackdated} alış faturası tespit edildi.${pendingBackdatedCount > 0 ? ` ${pendingBackdatedCount} fatura henüz stoğa/cariye işlenmemiştir; KDV dönemi, BA/BS ve ağırlıklı ortalama maliyet (AOM) dengesi için kontrol ediniz.` : " Dönem sonu KDV ve maliyet kayıtlarınız için inceleyiniz."}`,
            count: totalBackdated,
            timestamp: backdatedOrCarryOverRes.rows[0]?.created_at || backdatedOrCarryOverRes.rows[0]?.invoice_date || nowIso,
            targetTab: "purchase_invoices",
            targetFilter: "backdated_carryover",
            actionText: "Ara Tarihli & Devreden Faturaları İncele",
            items: backdatedOrCarryOverRes.rows.slice(0, 6).map(r => {
              const dateStr = r.invoice_date ? new Date(r.invoice_date).toLocaleDateString("tr-TR") : "";
              const badge = r.is_prev_month ? "Önceki Ay Devir" : r.is_backdated ? "Ara Tarihli" : "Geçmiş Tarihli";
              const statusBadge = r.status === "pending" ? "Onay Bekliyor" : "İşlendi";
              return {
                id: r.id,
                label: `[${badge}] ${r.invoice_number || "Fatura"} - ${r.supplier_name}`,
                detail: `${dateStr} • ${Number(r.amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.currency || "TRY"} (${statusBadge})`
              };
            })
          });
        }
      } catch (e) {
        console.warn("[Radar Feed] Backdated/carry-over purchase invoices warning:", e);
      }
    }

    // 3. GİB Hatası & Reddedilen Faturalar (Critical)
    if (!isPortfolio && isEInvoiceActive) {
      try {
        const errInvoices = await pool.query(
          `SELECT si.id, si.invoice_number,
                  COALESCE(c.title, cust.name, 'Müşteri') as customer_name,
                  COALESCE(NULLIF(si.grand_total, 0), si.total_amount, 0) as total_amount,
                  si.currency, si.integration_status, si.integration_message, si.created_at 
           FROM sales_invoices si
           LEFT JOIN companies c ON si.company_id = c.id
           LEFT JOIN customers cust ON si.customer_id = cust.id
           WHERE si.store_id = $1 
             AND COALESCE(si.invoice_type, '') NOT IN ('receipt', 'pos_receipt')
             AND COALESCE(si.notes, '') NOT LIKE '%Hızlı POS%'
             AND COALESCE(NULLIF(TRIM(si.customer_name), ''), '') != 'Hızlı Satış'
             AND si.integration_status IN ('REJECTED', 'Hata', 'İptal', 'İptal Edildi', 'Hatalı', 'CANCELLED', 'ERROR')
           ORDER BY si.created_at DESC LIMIT 5`,
          [storeId]
        );
        const errCountRes = await pool.query(
          `SELECT COUNT(*) FROM sales_invoices 
           WHERE store_id = $1 
             AND COALESCE(invoice_type, '') NOT IN ('receipt', 'pos_receipt')
             AND COALESCE(notes, '') NOT LIKE '%Hızlı POS%'
             AND COALESCE(NULLIF(TRIM(customer_name), ''), '') != 'Hızlı Satış'
             AND integration_status IN ('REJECTED', 'Hata', 'İptal', 'İptal Edildi', 'Hatalı', 'CANCELLED', 'ERROR')`,
          [storeId]
        );
        const totalErr = parseInt(errCountRes.rows[0]?.count || "0");
        if (totalErr > 0) {
          feed.push({
            id: "gib-errors",
            category: "gib",
            severity: "critical",
            title: "GİB Hata / Reddedilen Satış Faturaları",
            description: `${totalErr} faturada GİB entegrasyonu hata verdi veya alıcı tarafından reddedildi. Düzeltilip tekrar gönderilmeyi bekliyor.`,
            count: totalErr,
            timestamp: errInvoices.rows[0]?.created_at || nowIso,
            targetTab: "sales_invoices",
            targetFilter: "rejected",
            actionText: "Hatalı Faturaları İncele",
            items: errInvoices.rows.map(r => ({
              id: r.id,
              label: `${r.invoice_number} - ${r.customer_name || "Müşteri"}`,
              detail: r.integration_message || r.integration_status
            }))
          });
        }
      } catch (e) {
        console.warn("[Radar Feed] GIB error invoices check warning:", e);
      }
    }

    // 4. GİB'e Gönderilmeyi Bekleyen Satış Faturaları (Warning / Action Required)
    if (!isPortfolio && isEInvoiceActive) {
      try {
        const unsentInvoices = await pool.query(
          `SELECT si.id, si.invoice_number,
                  COALESCE(c.title, cust.name, 'Müşteri') as customer_name,
                  COALESCE(NULLIF(si.grand_total, 0), si.total_amount, 0) as grand_total,
                  si.currency, si.created_at, si.invoice_date
           FROM sales_invoices si
           LEFT JOIN companies c ON si.company_id = c.id
           LEFT JOIN customers cust ON si.customer_id = cust.id
           WHERE si.store_id = $1 
             AND si.status NOT IN ('cancelled', 'iptal')
             AND COALESCE(si.invoice_type, '') NOT IN ('receipt', 'pos_receipt')
             AND COALESCE(si.notes, '') NOT LIKE '%Hızlı POS%'
             AND COALESCE(NULLIF(TRIM(si.customer_name), ''), cust.name, '') != 'Hızlı Satış'
             AND (si.integration_status IS NULL OR si.integration_status IN ('', 'NOT_SENT', 'DRAFT', 'UNKNOWN', 'BILINMIYOR'))
             AND (si.ettn IS NULL OR length(trim(si.ettn)) < 5)
           ORDER BY COALESCE(si.created_at, si.invoice_date::timestamp) DESC LIMIT 5`,
          [storeId]
        );
        const unsentCountRes = await pool.query(
          `SELECT COUNT(*) FROM sales_invoices 
           WHERE store_id = $1 
             AND status NOT IN ('cancelled', 'iptal')
             AND COALESCE(invoice_type, '') NOT IN ('receipt', 'pos_receipt')
             AND COALESCE(notes, '') NOT LIKE '%Hızlı POS%'
             AND COALESCE(NULLIF(TRIM(customer_name), ''), '') != 'Hızlı Satış'
             AND (integration_status IS NULL OR integration_status IN ('', 'NOT_SENT', 'DRAFT', 'UNKNOWN', 'BILINMIYOR'))
             AND (ettn IS NULL OR length(trim(ettn)) < 5)`,
          [storeId]
        );
        const totalUnsent = parseInt(unsentCountRes.rows[0]?.count || "0");
        if (totalUnsent > 0) {
          feed.push({
            id: "gib-unsent",
            category: "gib",
            severity: "warning",
            title: "GİB'e Gönderilmeyi Bekleyen Satış Faturaları",
            description: `${totalUnsent} satış faturası henüz resmi GİB e-Fatura / e-Arşiv sistemine iletilmedi. Resmi geçerlilik için gönderilmesi gerekir.`,
            count: totalUnsent,
            timestamp: unsentInvoices.rows[0]?.created_at || nowIso,
            targetTab: "sales_invoices",
            targetFilter: "not_sent",
            actionText: "Gönderilmeyen Faturalara Git",
            items: unsentInvoices.rows.map(r => ({
              id: r.id,
              label: `${r.invoice_number || "Fatura"} - ${r.customer_name || "Müşteri"}`,
              detail: `${Number(r.grand_total || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.currency || "TRY"}`
            }))
          });
        }
      } catch (e) {
        console.warn("[Radar Feed] Unsent GIB invoices check warning:", e);
      }
    }

    // 5. Onay & Stok Kabulü Bekleyen Gelen Alış Faturaları (Supplier Invoices)
    if (!isPortfolio) {
      try {
        const unreadPurchase = await pool.query(
          `SELECT pi.id, pi.invoice_number,
                  COALESCE(NULLIF(TRIM(pi.supplier_name), ''), c.title, 'Tedarikçi') as supplier_name,
                  COALESCE(NULLIF(pi.grand_total, 0), pi.total_amount, 0) as total_amount,
                  pi.currency, pi.invoice_date, pi.created_at
           FROM purchase_invoices pi
           LEFT JOIN companies c ON pi.company_id = c.id
           WHERE pi.store_id = $1 AND pi.status = 'pending'
           ORDER BY pi.invoice_date DESC, pi.id DESC LIMIT 5`,
          [storeId]
        );
        const unreadPurchaseCountRes = await pool.query(
          `SELECT COUNT(*) FROM purchase_invoices WHERE store_id = $1 AND status = 'pending'`,
          [storeId]
        );
        const totalPendingPurchase = parseInt(unreadPurchaseCountRes.rows[0]?.count || "0");
        if (totalPendingPurchase > 0) {
          feed.push({
            id: "unread-purchase-invoices",
            category: "invoice",
            severity: "warning",
            title: "Stok & Cari Onayı Bekleyen Tedarikçi Alış Faturaları",
            description: `${totalPendingPurchase} adet gelen alış faturası henüz stoğa veya gider/cari kayıtlarına işlenmedi. Kalem eşleştirmelerini kontrol edip onaylayabilirsiniz.`,
            count: totalPendingPurchase,
            timestamp: unreadPurchase.rows[0]?.created_at || unreadPurchase.rows[0]?.invoice_date || nowIso,
            targetTab: "purchase_invoices",
            targetFilter: "pending",
            actionText: "Bekleyen Alış Faturalarını İşle",
            items: unreadPurchase.rows.map(r => ({
              id: r.id,
              label: `${r.invoice_number || "Alış Faturası"} - ${r.supplier_name || "Tedarikçi"}`,
              detail: `${r.invoice_date ? new Date(r.invoice_date).toLocaleDateString("tr-TR") + " • " : ""}${Number(r.total_amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.currency || "TRY"}`
            }))
          });
        }
      } catch (e) {
        console.warn("[Radar Feed] Unread purchase invoices warning:", e);
      }
    }

    // 6. Yeni Web Siparişleri (Action Required)
    if (!isPortfolio) {
      try {
        const webSales = await pool.query(
          `SELECT id, total_amount, currency, customer_name, payment_method, created_at 
           FROM sales 
           WHERE store_id = $1 
             AND status IN ('pending', 'processing', 'preparing') 
             AND (
               payment_method IN ('iyzico', 'credit_card', 'bank_transfer', 'cash_on_delivery', 'paypal', 'payoneer', 'store_reservation', 'online', 'web')
               OR source IN ('web', 'store')
               OR notes LIKE '%E-posta:%'
               OR notes LIKE '%Web Siparişi%'
             )
             AND COALESCE(source, '') NOT IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti')
           ORDER BY created_at DESC LIMIT 5`,
          [storeId]
        );
        const webSalesCountRes = await pool.query(
          `SELECT COUNT(*) FROM sales 
           WHERE store_id = $1 
             AND status IN ('pending', 'processing', 'preparing') 
             AND (
               payment_method IN ('iyzico', 'credit_card', 'bank_transfer', 'cash_on_delivery', 'paypal', 'payoneer', 'store_reservation', 'online', 'web')
               OR source IN ('web', 'store')
               OR notes LIKE '%E-posta:%'
               OR notes LIKE '%Web Siparişi%'
             )
             AND COALESCE(source, '') NOT IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti')`,
          [storeId]
        );
        const totalWebSales = parseInt(webSalesCountRes.rows[0]?.count || "0");
        if (totalWebSales > 0) {
          feed.push({
            id: "web-orders",
            category: "order",
            severity: "critical",
            title: "Yeni E-Ticaret Web Siparişleri",
            description: `${totalWebSales} yeni online web siparişi onay ve kargoya hazırlık aşamasında bekliyor.`,
            count: totalWebSales,
            timestamp: webSales.rows[0]?.created_at || nowIso,
            targetTab: "pos",
            targetFilter: "pending",
            actionText: "Siparişleri Yönet (POS)",
            items: webSales.rows.map(r => ({
              id: r.id,
              label: `#${r.id} - ${r.customer_name || "Müşteri"}`,
              detail: `${Number(r.total_amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.currency || "TRY"} (${r.payment_method || "Online"})`
            }))
          });
        }
      } catch (e) {}
    }

    // 7. İptal Edilen Web & E-Market Siparişleri (Warning)
    if (!isPortfolio) {
      try {
        const cancelledOrders = await pool.query(
          `SELECT id, total_amount, currency, customer_name, source, payment_method, notes, created_at 
           FROM sales 
           WHERE store_id = $1 
             AND status = 'cancelled'
             AND (
               source IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti')
               OR LOWER(COALESCE(payment_method, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama|marketplace)%'
               OR notes LIKE '%Web Siparişi%'
             )
           ORDER BY created_at DESC LIMIT 5`,
          [storeId]
        );
        const cancelledCountRes = await pool.query(
          `SELECT COUNT(*) FROM sales 
           WHERE store_id = $1 
             AND status = 'cancelled'
             AND (
               source IN ('trendyol', 'hepsiburada', 'n11', 'amazon', 'pazarama', 'ciceksepeti')
               OR LOWER(COALESCE(payment_method, '')) SIMILAR TO '%(trendyol|hepsiburada|n11|amazon|pazarama|marketplace)%'
               OR notes LIKE '%Web Siparişi%'
             )`,
          [storeId]
        );
        const totalCancelled = parseInt(cancelledCountRes.rows[0]?.count || "0");
        if (totalCancelled > 0) {
          feed.push({
            id: "cancelled-orders",
            category: "order",
            severity: "warning",
            title: "İptal Edilen Web & Pazaryeri Siparişleri",
            description: `${totalCancelled} adet web veya pazaryeri siparişi müşteri veya platform tarafından iptal edildi. Fatura ve stok dönüşlerini kontrol ediniz.`,
            count: totalCancelled,
            timestamp: cancelledOrders.rows[0]?.created_at || nowIso,
            targetTab: "pos",
            targetFilter: "cancelled",
            actionText: "İptalleri İncele",
            items: cancelledOrders.rows.map(r => ({
              id: r.id,
              label: `#${r.id} - ${r.customer_name || "Müşteri"} (${resolveMarketplaceLabel(r)})`,
              detail: `${Number(r.total_amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.currency || "TRY"}`
            }))
          });
        }
      } catch (e) {}
    }

    // 8. Kritik & Tükenen Stoklar (Stock Alarm)
    if (!isPortfolio) {
      try {
        const lowStock = await pool.query(
          `SELECT id, name, barcode, stock_quantity, min_stock_level, price, currency 
           FROM products 
           WHERE store_id = $1 
             AND (stock_quantity <= COALESCE(min_stock_level, 0) OR stock_quantity <= 0)
           ORDER BY stock_quantity ASC LIMIT 6`,
          [storeId]
        );
        const lowStockCountRes = await pool.query(
          `SELECT COUNT(*) FROM products 
           WHERE store_id = $1 
             AND (stock_quantity <= COALESCE(min_stock_level, 0) OR stock_quantity <= 0)`,
          [storeId]
        );
        const totalLowStock = parseInt(lowStockCountRes.rows[0]?.count || "0");
        if (totalLowStock > 0) {
          feed.push({
            id: "low-stock",
            category: "stock",
            severity: "warning",
            title: "Kritik & Tükenen Stok Seviyesi",
            description: `${totalLowStock} ürün asgari stok limitinin altına düştü veya tükendi.${isShopLp ? " Pazaryerlerindeki satışların kesilmemesi için stok ikmali yapınız." : " Operasyonun aksamaması için stok ikmali yapınız."}`,
            count: totalLowStock,
            timestamp: nowIso,
            targetTab: "products",
            actionText: "Envanter ve Stokları Düzenle",
            items: lowStock.rows.map(r => ({
              id: r.id,
              label: r.name,
              detail: `Stok: ${r.stock_quantity} (Min: ${r.min_stock_level || 0})`
            }))
          });
        }
      } catch (e) {}
    }

    // 9. Cari Mutabakat Uyuşmazlığı (Critical - Action Required)
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
            label: `${r.company_title || "Cari Hesap"} (${Number(r.balance || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.currency || "TRY"})`,
            detail: r.dispute_note ? `İtiraz: ${String(r.dispute_note).slice(0, 45)}` : "Uyuşmazlık bildirildi"
          }))
        });
      }
    } catch (e) {}

    // 10. Onaylanan Dijital Cari Mutabakatlar (Success / Document Archive)
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
            label: `${r.company_title || "Cari Hesap"}`,
            detail: `${Number(r.balance || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.currency || "TRY"} ${r.responder_name ? `• ${r.responder_name}` : ""}`
          }))
        });
      }
    } catch (e) {}

    // 11. Müşteri Tarafından Reddedilen Teklifler
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
            label: `Teklif #${r.id} - ${r.customer_name || r.customer_title || "Müşteri"}`,
            detail: r.customer_response_note 
              ? `Ret Notu: ${String(r.customer_response_note).slice(0, 35)}` 
              : `${Number(r.total_amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.currency || "TRY"}`
          }))
        });
      }
    } catch (e) {}

    // 12. Müşteri Tarafından Onaylanan Teklifler
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
            label: `Teklif #${r.id} - ${r.customer_name || r.customer_title || "Müşteri"}`,
            detail: `${Number(r.total_amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.currency || "TRY"}`
          }))
        });
      }
    } catch (e) {}

    // 13. Yanıt Bekleyen Açık Teklifler
    try {
      const pendingQuotes = await pool.query(
        `SELECT id, customer_name, customer_title, total_amount, currency, expiry_date, created_at
         FROM quotations
         WHERE store_id = $1 AND status = 'pending'
         ORDER BY created_at DESC LIMIT 5`,
        [storeId]
      );
      const pendingQuotesCountRes = await pool.query(
        `SELECT COUNT(*) FROM quotations WHERE store_id = $1 AND status = 'pending'`,
        [storeId]
      );
      const totalPendingQuotes = parseInt(pendingQuotesCountRes.rows[0]?.count || "0");
      if (totalPendingQuotes > 0) {
        feed.push({
          id: "quotations-pending",
          category: "quotation",
          severity: "info",
          title: "Müşteri Yanıtı Bekleyen Açık Teklifler",
          description: `${totalPendingQuotes} adet açık fiyat teklifi müşteri onayı bekliyor. Takip araması yapabilir veya satışa dönüştürebilirsiniz.`,
          count: totalPendingQuotes,
          timestamp: pendingQuotes.rows[0]?.created_at || nowIso,
          targetTab: "quotations",
          targetFilter: "pending",
          actionText: "Bekleyen Teklifleri Yönet",
          items: pendingQuotes.rows.map(r => ({
            id: r.id,
            label: `Teklif #${r.id} - ${r.customer_name || r.customer_title || "Müşteri"}`,
            detail: `${Number(r.total_amount || 0).toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ${r.currency || "TRY"}`
          }))
        });
      }
    } catch (e) {}

    // 14. Yeni Otel Rezervasyonları (Strictly only when hotel_module_enabled is active)
    if (isHotelModuleActive) {
      try {
        const hotelRes = await pool.query(
          `SELECT id, guest_name, check_in_date, check_out_date, total_amount, currency, created_at 
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
              label: `${r.guest_name || "Misafir"}`,
              detail: `${r.check_in_date} → ${r.check_out_date} (${Number(r.total_amount || 0).toLocaleString("tr-TR")} ${r.currency || "TRY"})`
            }))
          });
        }
      } catch (e) {}
    }

    // 15. Şubeler Arası Stok Transferi
    if (!isPortfolio) {
      try {
        const transfers = await pool.query(
          `SELECT id, status, notes, created_at 
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
            description: `${transfers.rows.length} adet stok transferi onay, hazırlık veya teslim kabul aşamasında bekliyor.`,
            count: transfers.rows.length,
            timestamp: transfers.rows[0].created_at || nowIso,
            targetTab: "stock_transfer",
            actionText: "Transferleri Yönet",
            items: transfers.rows.map(r => ({
              id: r.id,
              label: `Transfer #${r.id} (${r.status})`,
              detail: `Tarih: ${new Date(r.created_at).toLocaleDateString("tr-TR")}`
            }))
          });
        }
      } catch (e) {}
    }

    // 16. Teknik Servis Kayıtları
    if (!isCafeRestaurant && !isPortfolio) {
      try {
        const serviceRecords = await pool.query(
          `SELECT id, customer_name, device_model, status, created_at 
           FROM service_records 
           WHERE store_id = $1 AND status IN ('received', 'diagnosing', 'waiting_approval')
           ORDER BY created_at DESC LIMIT 5`,
          [storeId]
        );
        if (serviceRecords.rows.length > 0) {
          feed.push({
            id: "service-records",
            category: "service",
            severity: "info",
            title: "İşlem Bekleyen Teknik Servis Cihazları",
            description: `${serviceRecords.rows.length} cihaz teslim alındı, teşhis, müşteri onayı veya onarım sırası bekliyor.`,
            count: serviceRecords.rows.length,
            timestamp: serviceRecords.rows[0].created_at || nowIso,
            targetTab: "service",
            actionText: "Servis Masasına Git",
            items: serviceRecords.rows.map(r => ({
              id: r.id,
              label: `${r.device_model || "Cihaz"} - ${r.customer_name || "Müşteri"}`,
              detail: `Kayıt: #${r.id}`
            }))
          });
        }
      } catch (e) {}
    }

    const isAutomotiveStore = ["AUTOMOTIVE", "MOTOR_VEHICLE", "AUTO", "AUTOLP", "GALERI", "OTO"].includes(sector);

    // 17. Araç Muayene, Sigorta & Periyodik Bakım (Filo / Oto Galeri Yönetimi)
    try {
      const expiringDocs = await pool.query(
        `SELECT v.id as vehicle_id, v.brand, v.model, v.plate, vd.type as document_type, vd.expiry_date 
         FROM vehicle_documents vd
         JOIN vehicles v ON vd.vehicle_id = v.id
         WHERE v.store_id = $1 AND vd.expiry_date <= CURRENT_DATE + INTERVAL '30 days'
         ORDER BY vd.expiry_date ASC LIMIT 5`,
        [storeId]
      );
      const maintenanceDue = await pool.query(
        `SELECT v.id as vehicle_id, v.brand, v.model, v.plate, vm.type as maint_type, vm.next_maintenance_date, vm.next_maintenance_mileage, v.current_mileage
         FROM vehicle_maintenance vm
         JOIN vehicles v ON vm.vehicle_id = v.id
         WHERE v.store_id = $1
           AND vm.status IN ('planned', 'scheduled')
           AND (vm.next_maintenance_date <= CURRENT_DATE + INTERVAL '30 days' OR (v.current_mileage >= vm.next_maintenance_mileage - 1000 AND vm.next_maintenance_mileage > 0))
         ORDER BY vm.next_maintenance_date ASC NULLS LAST LIMIT 5`,
        [storeId]
      );

      const fleetItems: Array<{ id: string | number; label: string; detail?: string }> = [];
      for (const r of expiringDocs.rows) {
        fleetItems.push({
          id: `vdoc_${r.vehicle_id}`,
          label: `${r.plate || ""} ${r.brand} ${r.model}`,
          detail: `${r.document_type}: ${r.expiry_date ? new Date(r.expiry_date).toLocaleDateString("tr-TR") : "-"}`
        });
      }
      for (const m of maintenanceDue.rows) {
        if (fleetItems.length >= 6) break;
        fleetItems.push({
          id: `vmaint_${m.vehicle_id}`,
          label: `${m.plate || ""} ${m.brand} ${m.model}`,
          detail: `Bakım (${m.maint_type || "Periyodik"}): ${m.next_maintenance_date ? new Date(m.next_maintenance_date).toLocaleDateString("tr-TR") : `${m.next_maintenance_mileage} km`}`
        });
      }

      const totalFleetAlerts = expiringDocs.rows.length + maintenanceDue.rows.length;
      if (totalFleetAlerts > 0) {
        feed.push({
          id: "fleet-docs",
          category: "fleet",
          severity: "warning",
          title: isAutomotiveStore
            ? "Oto Galeri Araç Muayene, Seyrüsefer/Sigorta & Bakım Hatırlatması"
            : "Filo Araç Muayene, Sigorta & Bakım Hatırlatması",
          description: isAutomotiveStore
            ? `Portföydeki ${totalFleetAlerts} aracın seyrüsefer, sigorta, muayene veya periyodik servis bakım tarihi yaklaştı.`
            : `${totalFleetAlerts} aracın resmi evrak/sigorta süresi veya periyodik bakım zamanı geldi.`,
          count: totalFleetAlerts,
          timestamp: nowIso,
          targetTab: "fleet",
          actionText: isAutomotiveStore ? "Araç Portföyüne Git" : "Filo Yönetimine Git",
          items: fleetItems
        });
      }
    } catch (e) {}

    // 18. Web Portföy & CRM Müşteri Talepleri (Emlak / Oto)
    if (isPortfolio) {
      try {
        const pendingLeads = await pool.query(
          `SELECT id, name, phone, email, notes, created_at 
           FROM real_estate_contacts 
           WHERE store_id = $1 
             AND (notes LIKE '%[MÜLK SAHİBİ BAŞVURUSU]%' OR notes LIKE '%[ARAÇ SAHİBİ BAŞVURUSU]%')
           ORDER BY created_at DESC LIMIT 5`,
          [storeId]
        );
        if (pendingLeads.rows.length > 0) {
          feed.push({
            id: "crm-pending-leads",
            category: "crm",
            severity: "warning",
            title: isAutomotiveStore
              ? "Bekleyen Araç Değerleme / Konsinye Başvuruları"
              : "Bekleyen Mülk Sahibi Portföy Başvuruları",
            description: isAutomotiveStore
              ? `${pendingLeads.rows.length} araç sahibi web siteniz üzerinden konsinye satış veya takas değerleme başvurusu gönderdi.`
              : `${pendingLeads.rows.length} mülk sahibi web siteniz üzerinden gayrimenkul değerleme ve portföy başvurusu gönderdi.`,
            count: pendingLeads.rows.length,
            timestamp: pendingLeads.rows[0].created_at || nowIso,
            targetTab: "real_estate_crm",
            targetFilter: "new",
            actionText: isAutomotiveStore ? "Araç Başvurularını İncele" : "Mülk Başvurularını İncele",
            items: pendingLeads.rows.map(r => ({
              id: r.id,
              label: `${r.name || "Müşteri"} (${r.phone || r.email || "-"})`,
              detail: r.notes ? String(r.notes).replace(/\[.*?\]/g, '').trim().slice(0, 50) : "Yeni başvuru"
            }))
          });
        }
      } catch (e) {}

      // 19. Yaklaşan Randevu & Test Sürüşü / Yer Gösterme Takvimi
      try {
        const upcomingTasks = await pool.query(
          `SELECT id, description, due_date, task_type
           FROM consultant_tasks
           WHERE store_id = $1
             AND (is_completed = false OR is_completed IS NULL)
             AND due_date IS NOT NULL
           ORDER BY due_date ASC LIMIT 5`,
          [storeId]
        );
        if (upcomingTasks.rows.length > 0) {
          feed.push({
            id: "crm-upcoming-appointments",
            category: "crm",
            severity: "info",
            title: isAutomotiveStore
              ? "Planlanan Araç Randevuları & Ekspertiz / Test Sürüşleri"
              : "Planlanan Yer Gösterme & Müşteri Randevuları",
            description: isAutomotiveStore
              ? `Takvimde ${upcomingTasks.rows.length} adet tamamlanmayı bekleyen müşteri randevusu, test sürüşü veya ekspertiz görüşmesi bulunuyor.`
              : `Takvimde ${upcomingTasks.rows.length} adet tamamlanmayı bekleyen yer gösterme veya müşteri görüşmesi bulunuyor.`,
            count: upcomingTasks.rows.length,
            timestamp: upcomingTasks.rows[0].due_date || nowIso,
            targetTab: "team-crm",
            targetFilter: "calendar",
            actionText: "Randevu Takvimini Aç",
            items: upcomingTasks.rows.map(r => ({
              id: r.id,
              label: String(r.description || "Randevu").slice(0, 48),
              detail: r.due_date ? new Date(r.due_date).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : ""
            }))
          });
        }
      } catch (e) {}
    }

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

