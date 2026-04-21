
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function cleanup() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  try {
    await client.connect();
    
    console.log("Cleaning up double transaction for GAP store...");
    const res = await client.query("DELETE FROM current_account_transactions WHERE id = 125");
    console.log("Deleted rows:", res.rowCount);

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
cleanup();
