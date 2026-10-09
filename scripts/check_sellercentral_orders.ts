import { pool } from '../models/db';

async function run() {
  const oids = ['407-5690211-8320347', '408-2798933-2570756', '402-3684405-6777962', '405-5332992-7393157'];
  for (const oid of oids) {
    console.log(`\n=================== ORDER: ${oid} ===================`);
    const ao = await pool.query("SELECT * FROM amazon_orders WHERE amazon_order_id = $1", [oid]);
    console.log("amazon_orders:", JSON.stringify(ao.rows, null, 2));
    
    const si = await pool.query("SELECT id, invoice_number, customer_name, status, total_amount FROM sales_invoices WHERE invoice_number LIKE $1", [`%${oid}%`]);
    console.log("sales_invoices:", JSON.stringify(si.rows, null, 2));

    const s = await pool.query("SELECT id, customer_name, total_amount, status, notes FROM sales WHERE notes LIKE $1", [`%${oid}%`]);
    console.log("sales:", JSON.stringify(s.rows, null, 2));
  }
  process.exit(0);
}

run();
