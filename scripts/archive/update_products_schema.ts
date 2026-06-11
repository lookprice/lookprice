
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function updateSchema() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    console.log("Adding columns to products table...");
    
    // Add is_web_sale
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS is_web_sale BOOLEAN DEFAULT TRUE
    `);
    
    // Add product_type
    await client.query(`
      ALTER TABLE products 
      ADD COLUMN IF NOT EXISTS product_type VARCHAR(20) DEFAULT 'product'
    `);

    console.log("Schema updated successfully!");
  } catch (err) {
    console.error("Error updating schema:", err);
  } finally {
    await client.end();
  }
}

updateSchema();
