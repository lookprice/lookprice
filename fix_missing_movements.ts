import pkg from 'pg';
const { Pool } = pkg;
import dotenv from "dotenv";
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixMovements() {
  try {
    const productId = 7781;
    const storeId = 2; // From check_stock.ts output
    
    const invoices = [
      { id: 206, number: '407-7619711-6189168', qty: 1, price: 5000 },
      { id: 203, number: '403-5685870-8092367', qty: 1, price: 5000 }
    ];

    console.log("Adding missing stock movements...");
    for (const inv of invoices) {
      await pool.query(
        "INSERT INTO stock_movements (store_id, product_id, type, quantity, source, description, unit_price, customer_info) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
        [storeId, productId, 'out', inv.qty, 'amazon', `Amazon Satışı: ${inv.number}`, inv.price, 'Pazaryeri Müşterisi']
      );
      console.log(`Added movement for invoice ${inv.number}`);
    }

    await pool.end();
    console.log("Done.");
  } catch (e) {
    console.error(e);
  }
}

fixMovements();
