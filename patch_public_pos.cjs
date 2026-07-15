const fs = require('fs');
const content = fs.readFileSync('routes/public.ts', 'utf8');

const newRoute = `
// Public POS Sale (e.g. from Digital Menu)
router.post("/pos/sale", async (req: any, res) => {
  const storeId = req.query.storeId || req.body.storeId;
  if (!storeId) return res.status(400).json({ error: "Store ID is required" });
  
  const { items, total, paymentMethod, customerName, notes, currency, exchangeRate, status, tableNumber } = req.body;
  const saleStatus = status || 'pending';
  const finalNotes = tableNumber ? \`Masa \${tableNumber} - Dijital Menü\` + (notes ? \` | \${notes}\` : '') : (notes || 'Dijital Menü Siparişi');
  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const saleRes = await client.query(
      "INSERT INTO sales (store_id, total_amount, currency, exchange_rate, status, customer_name, payment_method, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id",
      [storeId, total || 0, currency || 'TRY', exchangeRate || 1, saleStatus, customerName || 'Masa Siparişi', paymentMethod || 'cash', finalNotes]
    );
    const saleId = saleRes.rows[0].id;

    for (const item of items) {
      const itemTotal = Number(item.quantity) * Number(item.price);
      await client.query(
        "INSERT INTO sale_items (sale_id, product_id, product_name, quantity, unit_price, total_price) VALUES ($1, $2, $3, $4, $5, $6)",
        [saleId, item.productId || null, item.name || 'Ürün', item.quantity, item.price, itemTotal]
      );
    }
    
    await client.query("COMMIT");
    res.json({ success: true, saleId });
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("Public POS Sale Error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});
`;

if (!content.includes('/pos/sale')) {
  fs.writeFileSync('routes/public.ts', content + newRoute);
}
