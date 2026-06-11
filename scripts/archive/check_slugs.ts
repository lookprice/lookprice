
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkSlugs() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT id, name, slug, parent_id FROM stores WHERE slug = 'Girne'");
    console.log("Stores with slug 'Girne':");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkSlugs();
