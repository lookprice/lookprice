import { pool } from "./models/db";

async function run() {
  const query1 = `
    SELECT id, invoice_number, store_id, notes, status, created_at 
    FROM sales_invoices 
    WHERE invoice_number LIKE '%407-7619711-6189168%' 
       OR invoice_number LIKE '%403-5685870-8092367%' 
       OR notes LIKE '%407-7619711-6189168%' 
       OR notes LIKE '%403-5685870-8092367%'
  `;
  
  try {
    const res = await pool.query(query1);
    console.log("Invoices Found:", JSON.stringify(res.rows, null, 2));
    
    if (res.rows.length > 0) {
      const invoiceIds = res.rows.map(r => r.id);
      const query2 = `
        SELECT *
        FROM sales_invoice_items
        WHERE sales_invoice_id = ANY($1)
      `;
      const itemsRes = await pool.query(query2, [invoiceIds]);
      console.log("Raw Invoice Items:", JSON.stringify(itemsRes.rows, null, 2));
    }

    const query3 = `
      SELECT id, name, barcode, stock_quantity, store_id, product_type
      FROM products
      WHERE id = 7781
    `;
    const prodRes = await pool.query(query3);
    console.log("Product 7781 Details:", JSON.stringify(prodRes.rows, null, 2));

    const query4 = `
      SELECT * FROM stock_movements 
      WHERE description LIKE '%407-7619711-6189168%' 
         OR description LIKE '%403-5685870-8092367%'
    `;
    const moveRes = await pool.query(query4);
    console.log("Stock Movements matching invoice numbers:", JSON.stringify(moveRes.rows, null, 2));

    if (prodRes.rows.length > 0) {
      const prodId = prodRes.rows[0].id;
      const query5 = `SELECT * FROM stock_movements WHERE product_id = $1 ORDER BY created_at DESC`;
      const allMoves = await pool.query(query5, [prodId]);
      console.log(`All movements for product ${prodId}:`, JSON.stringify(allMoves.rows, null, 2));
    }

  } catch (err) {
    console.error("Query Error:", err);
  } finally {
    await pool.end();
  }
}

run();
