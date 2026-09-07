import { Pool } from "pg";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const userRes = await pool.query("SELECT * FROM users ORDER BY id ASC LIMIT 1");
    if (userRes.rows.length === 0) {
      console.log("No users found");
      process.exit(1);
    }
    const user = userRes.rows[0];
    console.log("Using user: ", user.email, "store_id:", user.store_id);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, store_id: user.store_id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: "10h" }
    );
    
    let sid = user.store_id;
    if (user.role === 'superadmin') {
      sid = 11; // Check store 11
    }

    const res = await fetch(`http://localhost:3000/api/store/sales-invoices?storeId=${sid}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const body = await res.text();
    console.log("Status:", res.status);
    console.log("Body length:", body.length);
    console.log("Body abstract:", body.substring(0, 1000));

    // What if it is Fast Pos?
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
