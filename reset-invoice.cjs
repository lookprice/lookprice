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
  console.log("Reset invoice 506 to draft");
  process.exit(0);
}
run();
