import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const salesTables = await client.query(`
    SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%sales%' OR table_name = 'transactions';
  `);
  console.log("Sales Tables:", salesTables.rows);
  await client.end();
}
run();
