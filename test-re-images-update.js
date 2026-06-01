import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const res = await pool.query(
      "UPDATE real_estate_properties SET images = $1 WHERE id = 7 RETURNING id, images",
      [ ["https://example.com/test.jpg", "https://example.com/test2.jpg"] ]
    );
    console.log("Success with JS array:", res.rows);
  } catch(e) {
    console.error("Error with JS array:", e.message);
  }
  pool.end();
}
run();
