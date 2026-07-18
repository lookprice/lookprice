import express from "express";
import { pool } from "../../models/db";

const router = express.Router();

// --- POS Daily Report ---

router.get("/daily-sales", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { startDate, endDate } = req.query;
  
  try {
    const start = startDate ? new Date(startDate as string) : new Date();
    start.setHours(0, 0, 0, 0);
    const end = endDate ? new Date(endDate as string) : new Date();
    end.setHours(23, 59, 59, 999);

    const summaryQuery = `
      SELECT 
        sp.payment_method, 
        SUM(sp.amount)::FLOAT as total_amount, 
        COUNT(DISTINCT sp.sale_id)::INT as transaction_count
      FROM sale_payments sp
      JOIN sales s ON sp.sale_id = s.id
      WHERE s.store_id = $1 
        AND s.status = 'completed'
        AND s.created_at >= $2 
        AND s.created_at <= $3
      GROUP BY sp.payment_method
    `;
    const summaryRes = await pool.query(summaryQuery, [storeId, start, end]);

    const detailsQuery = `
      SELECT 
        s.created_at,
        s.customer_name,
        sp.amount,
        sp.payment_method,
        s.source,
        s.id as sale_id
      FROM sale_payments sp
      JOIN sales s ON sp.sale_id = s.id
      WHERE s.store_id = $1 
        AND s.status = 'completed'
        AND s.created_at >= $2 
        AND s.created_at <= $3
      ORDER BY s.created_at DESC
    `;
    const detailsRes = await pool.query(detailsQuery, [storeId, start, end]);

    res.json({
      success: true,
      summary: summaryRes.rows,
      details: detailsRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/pos-daily", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  const { date } = req.query;
  
  try {
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const paymentQuery = `
      SELECT payment_method, SUM(amount)::FLOAT as total
      FROM sale_payments sp
      JOIN sales s ON sp.sale_id = s.id
      WHERE s.store_id = $1 
        AND s.status = 'completed'
        AND s.created_at >= $2 
        AND s.created_at <= $3
      GROUP BY payment_method
    `;
    const paymentRes = await pool.query(paymentQuery, [storeId, startOfDay, endOfDay]);

    const productQuery = `
      SELECT si.product_name, SUM(si.quantity)::FLOAT as total_quantity
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      WHERE s.store_id = $1 
        AND s.status = 'completed'
        AND s.created_at >= $2 
        AND s.created_at <= $3
      GROUP BY si.product_name
      ORDER BY total_quantity DESC
    `;
    const productRes = await pool.query(productQuery, [storeId, startOfDay, endOfDay]);

    res.json({
      success: true,
      date: startOfDay.toISOString().split('T')[0],
      payments: paymentRes.rows,
      products: productRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Analytics Dashboard ---

router.get("/analytics", async (req: any, res) => {
  const storeId = req.user.role === "superadmin" ? (req.query.storeId || req.user.store_id) : req.user.store_id;
  if (!storeId) return res.status(400).json({ error: "Store ID required" });

  try {
    const { startDate, endDate } = req.query;
    
    const currentMonthStart = startDate ? new Date(startDate as string) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const currentMonthEnd = endDate ? new Date(endDate as string) : new Date();
    if (endDate) currentMonthEnd.setHours(23, 59, 59, 999);

    const totalScans = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs WHERE store_id = $1", [storeId])).rows[0].count;
    const monthlyScans = (await pool.query("SELECT COUNT(*)::INT as count FROM scan_logs WHERE store_id = $1 AND created_at BETWEEN $2 AND $3", [storeId, currentMonthStart, currentMonthEnd])).rows[0].count;
    const totalProducts = (await pool.query("SELECT COUNT(*)::INT as count FROM products WHERE store_id = $1", [storeId])).rows[0].count;
    const lowStockCount = (await pool.query("SELECT COUNT(*)::INT as count FROM products WHERE store_id = $1 AND product_type != 'service' AND stock_quantity <= min_stock_level", [storeId])).rows[0].count;
    
    const salesMatrahQuery = `
      SELECT SUM(amount)::FLOAT as amount FROM (
        SELECT SUM(total_amount * COALESCE(exchange_rate, 1)) as amount 
        FROM sales_invoices 
        WHERE store_id = $1 AND status != 'cancelled' AND invoice_date BETWEEN $2 AND $3
        UNION ALL
        SELECT SUM(total_amount) as amount 
        FROM sales 
        WHERE store_id = $1 AND status = 'completed' AND created_at BETWEEN $2 AND $3
        AND id NOT IN (SELECT COALESCE(sale_id, -1) FROM sales_invoices WHERE store_id = $1)
      ) combined
    `;
    const monthlySalesAmount = (await pool.query(salesMatrahQuery, [storeId, currentMonthStart, currentMonthEnd])).rows[0].amount || 0;

    const totalSalesMatrahQuery = `
      SELECT SUM(amount)::FLOAT as amount FROM (
        SELECT SUM(total_amount * COALESCE(exchange_rate, 1)) as amount 
        FROM sales_invoices 
        WHERE store_id = $1 AND status != 'cancelled'
        UNION ALL
        SELECT SUM(total_amount) as amount 
        FROM sales 
        WHERE store_id = $1 AND status = 'completed'
        AND id NOT IN (SELECT COALESCE(sale_id, -1) FROM sales_invoices WHERE store_id = $1)
      ) combined
    `;
    const totalSalesAmount = (await pool.query(totalSalesMatrahQuery, [storeId])).rows[0].amount || 0;

    const monthlyPurchaseAmount = (await pool.query(
      "SELECT SUM(total_amount * COALESCE(exchange_rate, 1))::FLOAT as amount FROM purchase_invoices WHERE store_id = $1 AND is_expense = FALSE AND invoice_date BETWEEN $2 AND $3", 
      [storeId, currentMonthStart, currentMonthEnd]
    )).rows[0].amount || 0;

    const monthlyExpenseAmount = (await pool.query(
      "SELECT SUM(total_amount * COALESCE(exchange_rate, 1))::FLOAT as amount FROM purchase_invoices WHERE store_id = $1 AND is_expense = TRUE AND invoice_date BETWEEN $2 AND $3", 
      [storeId, currentMonthStart, currentMonthEnd]
    )).rows[0].amount || 0;

    const expenseCategories = await pool.query(`
      SELECT expense_category as category, SUM(total_amount * COALESCE(exchange_rate, 1))::FLOAT as amount 
      FROM purchase_invoices 
      WHERE store_id = $1 AND is_expense = TRUE AND invoice_date BETWEEN $2 AND $3
      GROUP BY expense_category
      ORDER BY amount DESC
    `, [storeId, currentMonthStart, currentMonthEnd]);

    const monthlyHistory = [];
    for (let i = 0; i < 12; i++) {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
        const monthEnd = new Date(new Date().getFullYear(), new Date().getMonth() - i + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);
        
        const sales = (await pool.query(`
            SELECT SUM(amount)::FLOAT as amount FROM (
              SELECT SUM(total_amount * COALESCE(exchange_rate, 1)) as amount 
              FROM sales_invoices 
              WHERE store_id = $1 AND status != 'cancelled' AND invoice_date BETWEEN $2 AND $3
              UNION ALL
              SELECT SUM(total_amount) as amount 
              FROM sales 
              WHERE store_id = $1 AND status = 'completed' AND created_at BETWEEN $2 AND $3
              AND id NOT IN (SELECT COALESCE(sale_id, -1) FROM sales_invoices WHERE store_id = $1)
            ) combined
        `, [storeId, monthStart, monthEnd])).rows[0].amount || 0;

        const purchases = (await pool.query(
            "SELECT SUM(total_amount * COALESCE(exchange_rate, 1))::FLOAT as amount FROM purchase_invoices WHERE store_id = $1 AND is_expense = FALSE AND invoice_date BETWEEN $2 AND $3",
            [storeId, monthStart, monthEnd]
        )).rows[0].amount || 0;

        const expenses = (await pool.query(
            "SELECT SUM(total_amount * COALESCE(exchange_rate, 1))::FLOAT as amount FROM purchase_invoices WHERE store_id = $1 AND is_expense = TRUE AND invoice_date BETWEEN $2 AND $3",
            [storeId, monthStart, monthEnd]
        )).rows[0].amount || 0;

        monthlyHistory.push({
            period: monthStart.toLocaleString('tr-TR', { month: 'long', year: 'numeric' }),
            sales_matrah: sales,
            purchase_matrah: purchases,
            expense_total: expenses,
            net_volume: sales - purchases - expenses
        });
    }

    const totalImpressions = (await pool.query("SELECT COUNT(*)::INT as count FROM store_analytics_events WHERE store_id = $1 AND event_type = 'impression'", [storeId])).rows[0].count;
    const totalDetailViews = (await pool.query("SELECT COUNT(*)::INT as count FROM store_analytics_events WHERE store_id = $1 AND event_type = 'view'", [storeId])).rows[0].count;
    const whatsappClicks = (await pool.query("SELECT COUNT(*)::INT as count FROM store_analytics_events WHERE store_id = $1 AND event_type = 'whatsapp_click'", [storeId])).rows[0].count;
    const phoneClicks = (await pool.query("SELECT COUNT(*)::INT as count FROM store_analytics_events WHERE store_id = $1 AND event_type = 'phone_click'", [storeId])).rows[0].count;

    const dailyEvents = await pool.query(`
      SELECT TO_CHAR(d.date, 'DD/MM') as date, 
             COALESCE(imp.count, 0)::INT as impressions,
             COALESCE(clk.count, 0)::INT as clicks
      FROM (
        SELECT (CURRENT_DATE - (n || ' days')::INTERVAL)::DATE as date
        FROM generate_series(0, 6) n
      ) d
      LEFT JOIN (
        SELECT DATE(created_at) as ev_date, COUNT(*)::INT as count
        FROM store_analytics_events
        WHERE store_id = $1 AND event_type = 'impression'
        GROUP BY DATE(created_at)
      ) imp ON d.date = imp.ev_date
      LEFT JOIN (
        SELECT DATE(created_at) as ev_date, COUNT(*)::INT as count
        FROM store_analytics_events
        WHERE store_id = $1 AND event_type IN ('click', 'whatsapp_click', 'phone_click', 'quote_click')
        GROUP BY DATE(created_at)
      ) clk ON d.date = clk.ev_date
      ORDER BY d.date ASC
    `, [storeId]);

    const dailyScans = await pool.query(`
      SELECT TO_CHAR(d.date, 'DD/MM') as date, COALESCE(s.count, 0)::INT as count FROM (
        SELECT (CURRENT_DATE - (n || ' days')::INTERVAL)::DATE as date
        FROM generate_series(0, 6) n
      ) d
      LEFT JOIN (
        SELECT DATE(created_at) as scan_date, COUNT(*)::INT as count 
        FROM scan_logs 
        WHERE store_id = $1 
        GROUP BY DATE(created_at)
      ) s ON d.date = s.scan_date
      ORDER BY d.date ASC
    `, [storeId]);

    const dailySales = await pool.query(`
      SELECT TO_CHAR(d.date, 'DD/MM') as date, COALESCE(s.amount, 0)::FLOAT as amount FROM (
        SELECT (CURRENT_DATE - (n || ' days')::INTERVAL)::DATE as date
        FROM generate_series(0, 6) n
      ) d
      LEFT JOIN (
        SELECT DATE(created_at) as sale_date, SUM(total_amount) as amount 
        FROM sales 
        WHERE store_id = $1 AND status = 'completed'
        GROUP BY DATE(created_at)
      ) s ON d.date = s.sale_date
      ORDER BY d.date ASC
    `, [storeId]);

    const topProducts = await pool.query(`
      SELECT p.name, p.barcode, COUNT(l.id)::INT as count 
      FROM scan_logs l 
      JOIN products p ON l.product_id = p.id 
      WHERE l.store_id = $1 
      GROUP BY l.product_id, p.name, p.barcode 
      ORDER BY count DESC 
      LIMIT 5
    `, [storeId]);

    const lowStockProducts = await pool.query(`
      SELECT name, barcode, stock_quantity, min_stock_level 
      FROM products 
      WHERE store_id = $1 AND product_type != 'service' AND stock_quantity <= min_stock_level
      ORDER BY stock_quantity ASC
      LIMIT 5
    `, [storeId]);

    const topCompanies = await pool.query(`
      SELECT c.id, c.title, 
             COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount * COALESCE(t.exchange_rate, 1) ELSE -t.amount * COALESCE(t.exchange_rate, 1) END), 0)::FLOAT as balance
      FROM companies c
      LEFT JOIN current_account_transactions t ON c.id = t.company_id
      WHERE c.store_id = $1
      GROUP BY c.id, c.title
      HAVING COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount * COALESCE(t.exchange_rate, 1) ELSE -t.amount * COALESCE(t.exchange_rate, 1) END), 0) > 0
      ORDER BY balance DESC
      LIMIT 5
    `, [storeId]);

    // Real Estate / Portfolio Analytics
    let totalProperties = 0;
    let activeListings = 0;
    let completedDeals = 0;
    let pendingTasks = 0;
    let statusCounts = { active: 0, optioned: 0, sold_or_rented: 0 };
    let recentActivities = [];
    let prAuditLogs = [];
    let performanceChartData = [];
    let portfolioAlerts = [];
    let strategicInsights = [];

    try {
      const propertyStatsRes = await pool.query("SELECT status, COUNT(*)::INT as count FROM real_estate_properties WHERE store_id = $1 GROUP BY status", [storeId]);
      const vehicleStatsRes = await pool.query("SELECT status, COUNT(*)::INT as count FROM vehicles WHERE store_id = $1 GROUP BY status", [storeId]);
      
      propertyStatsRes.rows.forEach(row => {
        totalProperties += row.count;
        if (row.status === 'active') { activeListings += row.count; statusCounts.active += row.count; }
        else if (row.status === 'optioned') { statusCounts.optioned += row.count; }
        else if (['sold_or_rented', 'sold', 'rented'].includes(row.status)) { completedDeals += row.count; statusCounts.sold_or_rented += row.count; }
      });

      vehicleStatsRes.rows.forEach(row => {
        totalProperties += row.count;
        if (['active', 'for_sale'].includes(row.status)) { activeListings += row.count; statusCounts.active += row.count; }
        else if (row.status === 'sold') { completedDeals += row.count; statusCounts.sold_or_rented += row.count; }
      });

      const pendingTasksRes = await pool.query("SELECT COUNT(*)::INT as count FROM property_tasks pt JOIN real_estate_properties rp ON pt.property_id = rp.id WHERE rp.store_id = $1 AND pt.status = 'pending'", [storeId]);
      pendingTasks = pendingTasksRes.rows[0]?.count || 0;

      const auditLogsRes = await pool.query(`
        SELECT l.id, l.created_at as timestamp, l.action, l.details, COALESCE(u.username, 'Temsilci') as user
        FROM property_audit_log l
        LEFT JOIN real_estate_properties p ON l.property_id = p.id
        LEFT JOIN users u ON l.changed_by = u.id
        WHERE p.store_id = $1 OR (l.property_id IS NULL AND l.changed_by IN (SELECT id FROM users WHERE store_id = $1))
        ORDER BY l.created_at DESC LIMIT 10
      `, [storeId]);
      
      prAuditLogs = auditLogsRes.rows.map(row => ({
        timestamp: new Date(row.timestamp).toLocaleString('tr-TR'),
        action: row.details || row.action,
        user: row.user
      }));

      const chartDataRes = await pool.query(`
        WITH month_series AS (SELECT DATE_TRUNC('month', CURRENT_DATE - (n * INTERVAL '1 month')) as m_date FROM generate_series(0, 5) n)
        SELECT TO_CHAR(ms.m_date, 'YYYY-MM') as name, COALESCE(SUM(t.amount * CASE WHEN t.type = 'income' THEN 1 ELSE -1 END), 0)::FLOAT as value
        FROM month_series ms LEFT JOIN portfolio_transactions t ON DATE_TRUNC('month', t.date) = ms.m_date AND t.store_id = $1
        GROUP BY ms.m_date ORDER BY ms.m_date ASC
      `, [storeId]);
      
      performanceChartData = chartDataRes.rows.map(row => ({ name: row.name, value: row.value }));

    } catch (reErr) { console.error("Real Estate Analytics Error:", reErr); }

    res.json({
      total_scans: totalScans,
      monthly_scans: monthlyScans,
      total_products: totalProducts,
      low_stock_count: lowStockCount,
      total_sales_amount: totalSalesAmount,
      monthly_sales_amount: monthlySalesAmount,
      monthly_purchase_amount: monthlyPurchaseAmount,
      monthly_expense_amount: monthlyExpenseAmount,
      expense_categories: expenseCategories.rows,
      monthly_history: monthlyHistory,
      daily_scans: dailyScans.rows,
      daily_sales: dailySales.rows,
      top_products: topProducts.rows,
      low_stock_products: lowStockProducts.rows,
      top_companies: topCompanies.rows,
      active_listings: activeListings,
      completed_deals: completedDeals,
      pending_tasks: pendingTasks,
      total_properties: totalProperties,
      status_counts: statusCounts,
      audit_logs: prAuditLogs,
      performance_chart_data: performanceChartData,
      total_impressions: totalImpressions,
      total_detail_views: totalDetailViews,
      whatsapp_clicks: whatsappClicks,
      phone_clicks: phoneClicks,
      daily_events: dailyEvents.rows
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
