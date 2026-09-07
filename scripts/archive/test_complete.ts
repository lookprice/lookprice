import { pool } from './models/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = await pool.connect();
  try {
    console.log("Starting transaction...");
    await client.query("BEGIN");
    
    const id = 7;
    const transferRes = await client.query("SELECT * FROM stock_transfers WHERE id = $1", [id]);
    const transfer = transferRes.rows[0];
    
    console.log("Transfer:", transfer);
    
    const itemsRes = await client.query("SELECT * FROM stock_transfer_items WHERE transfer_id = $1", [id]);
    console.log("Items:", itemsRes.rows);
    
    for (const item of itemsRes.rows) {
      console.log("Processing item:", item);
      
      // Decrease from sender
      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2 AND store_id = $3",
        [item.quantity, item.product_id, transfer.from_store_id]
      );
      await client.query(
        "INSERT INTO stock_movements (store_id, product_id, type, quantity, description) VALUES ($1, $2, 'out', $3, $4)",
        [transfer.from_store_id, item.product_id, item.quantity, `Transfer to store #${transfer.to_store_id}`]
      );

      // Increase at receiver
      const receiverProductRes = await client.query(
        "SELECT id FROM products WHERE store_id = $1 AND barcode = $2",
        [transfer.to_store_id, item.barcode]
      );

      let receiverProductId;
      if (receiverProductRes.rows.length > 0) {
        console.log("Product exists at receiver");
        receiverProductId = receiverProductRes.rows[0].id;
        await client.query(
          "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2",
          [item.quantity, receiverProductId]
        );
      } else {
        console.log("Product does NOT exist at receiver, creating...");
        const senderProductRes = await client.query("SELECT * FROM products WHERE id = $1", [item.product_id]);
        const sp = senderProductRes.rows[0];
        console.log("Sender product:", sp);
        
        const newProductRes = await client.query(
          `INSERT INTO products (store_id, barcode, name, price, currency, cost_price, cost_currency, tax_rate, description, stock_quantity, unit, category)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
          [transfer.to_store_id, sp.barcode, sp.name, sp.price, sp.currency, sp.cost_price, sp.cost_currency, sp.tax_rate, sp.description, item.quantity, sp.unit, sp.category]
        );
        receiverProductId = newProductRes.rows[0].id;
        console.log("Created new product ID:", receiverProductId);
      }

      await client.query(
        "INSERT INTO stock_movements (store_id, product_id, type, quantity, description) VALUES ($1, $2, 'in', $3, $4)",
        [transfer.to_store_id, receiverProductId, item.quantity, `Transfer from store #${transfer.from_store_id}`]
      );
    }
    
    await client.query("UPDATE stock_transfers SET status = 'completed' WHERE id = 7");
    await client.query("COMMIT");
    console.log("Success!");
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Error:", e);
  } finally {
    client.release();
    process.exit(0);
  }
}
run();
