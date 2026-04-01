
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkStore11() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT * FROM stores WHERE id = 11");
    console.log("Store ID 11 Data:");
    console.log(JSON.stringify(res.rows[0], null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkStore11();
