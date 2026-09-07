
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllUsers() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    const res = await client.query("SELECT id, email, role, store_id FROM users");
    console.log("All Users:");
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkAllUsers();
