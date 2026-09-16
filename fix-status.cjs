const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  await pool.query(`
    UPDATE sales_invoices 
    SET document_number = NULL, 
        ettn = NULL, 
        integration_status = NULL, 
        integration_message = NULL, 
        e_document_type = NULL,
        status = 'draft' 
    WHERE id = 506
  `);
  const res = await pool.query("SELECT id, status, document_number, integration_status FROM sales_invoices WHERE id = 506");
  console.log("Updated invoice 506:", res.rows[0]);
  process.exit(0);
}
run();
