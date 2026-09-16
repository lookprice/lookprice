const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function run() {
  const query = `
    UPDATE sales_invoices 
    SET document_number = NULL, 
        ettn = NULL, 
        integration_status = NULL, 
        integration_message = NULL, 
        e_document_type = NULL,
        status = 'draft' 
    WHERE document_number = 'GEF2026000000134'
    RETURNING id, document_number, status, ettn;
  `;
  const res = await pool.query(query);
  console.log("Updated:", res.rows);
  process.exit(0);
}
run();
