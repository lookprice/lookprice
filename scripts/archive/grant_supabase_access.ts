import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  console.log("Running Supabase explicitly grant migration...");
  // Note: RLS should be enabled after grants are in place to ensure access is not blocked during GRANT
  await pool.query(`
    -- Stores
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stores TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stores TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.stores TO service_role;
    ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

    -- Sales Invoices
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales_invoices TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales_invoices TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sales_invoices TO service_role;
    ALTER TABLE public.sales_invoices ENABLE ROW LEVEL SECURITY;
    
    -- Purchase Invoices
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_invoices TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_invoices TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.purchase_invoices TO service_role;
    ALTER TABLE public.purchase_invoices ENABLE ROW LEVEL SECURITY;

    -- Products
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO service_role;
    ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
    
    -- Customers
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.customers TO service_role;
    ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

    -- Audit Logs
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO anon;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO authenticated;
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO service_role;
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  `).catch(e => console.error("Error executing grants:", e));
  
  console.log("Supabase explicitly grant migration finished.");
  process.exit(0);
}
run();
