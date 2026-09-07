const fs = require('fs');
let content = fs.readFileSync('routes/store/sales.ts', 'utf8');

const newRoute = `
router.post("/:id/create-invoice", async (req: any, res) => {
  const { id } = req.params;
  const storeId = req.query.storeId ? parseInt(req.query.storeId as string) : req.user.storeId;
  
  try {
    await pool.query("BEGIN");
    
    const saleRes = await pool.query("SELECT * FROM sales WHERE id = $1 AND store_id = $2", [id, storeId]);
    if (saleRes.rows.length === 0) {
      await pool.query("ROLLBACK");
      return res.status(404).json({ error: "Sale not found" });
    }
    const sale = saleRes.rows[0];
    
    if (sale.sales_invoice_id) {
      await pool.query("ROLLBACK");
      return res.status(400).json({ error: "Sale is already invoiced" });
    }
    
    // Generate invoice number
    const prefix = 'SATIŞ-';
    const numberRes = await pool.query(
      "SELECT invoice_number FROM sales_invoices WHERE store_id = $1 AND invoice_number LIKE $2 ORDER BY id DESC LIMIT 1",
      [storeId, \`\${prefix}%\`]
    );
    let nextNum = 1;
    if (numberRes.rows.length > 0) {
      const match = numberRes.rows[0].invoice_number.match(/\\d+$/);
      if (match) nextNum = parseInt(match[0]) + 1;
    }
    const invoiceNumber = \`\${prefix}\${nextNum.toString().padStart(6, '0')}\`;
    
    // Create sales invoice
    const invRes = await pool.query(
      \`INSERT INTO sales_invoices (
        store_id, invoice_number, issue_date, invoice_type, status,
        customer_name, customer_email, customer_phone, customer_address,
        customer_tc_id, customer_tax_number, customer_tax_office, customer_company_title, customer_is_corporate,
        subtotal, tax_amount, total_amount, currency, notes
      ) VALUES (
        $1, $2, CURRENT_DATE, 'retail', 'draft',
        $3, $4, $5, $6,
        $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16
      ) RETURNING id\`,
      [
        storeId, invoiceNumber,
        sale.customer_name, sale.customer_email || '', sale.customer_phone || '', sale.customer_address || '',
        sale.customer_tc_id || '', sale.customer_tax_number || '', sale.customer_tax_office || '', sale.customer_company_title || '', sale.customer_is_corporate || false,
        sale.total_amount, 0, sale.total_amount, sale.currency, sale.notes || ''
      ]
    );
    
    const invoiceId = invRes.rows[0].id;
    
    // Get sale items
    const itemsRes = await pool.query("SELECT * FROM sale_items WHERE sale_id = $1", [id]);
    
    // Insert invoice items
    for (const item of itemsRes.rows) {
      await pool.query(
        \`INSERT INTO sales_invoice_items (
          sales_invoice_id, product_name, quantity, unit_price, tax_rate, tax_amount, total_price
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)\`,
        [
          invoiceId,
          item.product_name,
          item.quantity,
          item.unit_price,
          0, // Web sales items might not have tax_rate recorded, assume 0
          0,
          item.total_price
        ]
      );
    }
    
    // Link sale to invoice
    await pool.query(
      "UPDATE sales SET sales_invoice_id = $1, sales_invoice_number = $2 WHERE id = $3",
      [invoiceId, invoiceNumber, id]
    );
    
    await pool.query("COMMIT");
    res.json({ success: true, invoice_id: invoiceId });
  } catch (err: any) {
    await pool.query("ROLLBACK");
    res.status(500).json({ error: err.message });
  }
});
`;

content += "\n" + newRoute;
fs.writeFileSync('routes/store/sales.ts', content);
