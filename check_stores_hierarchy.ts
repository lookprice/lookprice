
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkStores() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT id, name, slug, parent_id FROM stores WHERE id IN (1, 11)");
    console.log("Stores Data:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkStores();
