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
    const userRes = await pool.query("SELECT * FROM users WHERE role='superadmin' LIMIT 1");
    const user = userRes.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, store_id: user.store_id },
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: "10h" }
    );
    
    // Simulate API call locally as a superadmin without storeId
    const res = await fetch(`http://localhost:3000/api/store/sales?status=all&startDate=2026-03-19&endDate=2026-04-18`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const body = await res.text();
    console.log("Status:", res.status);
    console.log("Body length:", body.length);
    console.log("Body abstract:", body.substring(0, 1000));

    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
