import pkg from 'pg';
const { Pool } = pkg;
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Initialize Database
export async function initDb() {
  console.log("Initializing database...");
  const client = await pool.connect();
  console.log("Database connected.");
  try {
    console.log("Running schema queries...");
    await client.query(`
      -- Update existing columns to REAL if they are INTEGER
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock_quantity' AND data_type='integer') THEN
          ALTER TABLE products ALTER COLUMN stock_quantity TYPE REAL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='min_stock_level' AND data_type='integer') THEN
          ALTER TABLE products ALTER COLUMN min_stock_level TYPE REAL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_movements' AND column_name='quantity' AND data_type='integer') THEN
          ALTER TABLE stock_movements ALTER COLUMN quantity TYPE REAL;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoice_items' AND column_name='quantity' AND data_type='integer') THEN
          ALTER TABLE purchase_invoice_items ALTER COLUMN quantity TYPE REAL;
        END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS stores (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        address TEXT,
        contact_person TEXT,
        phone TEXT,
        country TEXT,
        email TEXT,
        api_key TEXT UNIQUE,
        subscription_end DATE,
        logo_url TEXT,
        favicon_url TEXT,
        primary_color TEXT DEFAULT '#4f46e5',
        default_currency TEXT DEFAULT 'TRY',
        language TEXT DEFAULT 'tr',
        plan TEXT DEFAULT 'free',
        background_image_url TEXT,
        fiscal_brand TEXT,
        fiscal_terminal_id TEXT,
        fiscal_active BOOLEAN DEFAULT FALSE,
        default_tax_rate INTEGER DEFAULT 20,
        currency_rates JSONB DEFAULT '{"USD": 1, "EUR": 1, "GBP": 1}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE stores ADD COLUMN IF NOT EXISTS default_tax_rate INTEGER DEFAULT 20;

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        barcode TEXT NOT NULL,
        name TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT DEFAULT 'TRY',
        cost_price REAL DEFAULT 0,
        cost_currency TEXT DEFAULT 'TRY',
        tax_rate REAL DEFAULT 20,
        description TEXT,
        stock_quantity REAL DEFAULT 0,
        min_stock_level REAL DEFAULT 5,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        UNIQUE(store_id, barcode)
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price REAL DEFAULT 0;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_currency TEXT DEFAULT 'TRY';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS tax_rate REAL DEFAULT 20;

      CREATE TABLE IF NOT EXISTS scan_logs (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        store_id INTEGER,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('superadmin', 'storeadmin', 'editor', 'viewer')) NOT NULL,
        reset_token TEXT,
        reset_token_expiry TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id)
      );

      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        store_name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        status TEXT DEFAULT 'Yeni',
        probability TEXT DEFAULT 'Ilık',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS quotations (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_title TEXT,
        total_amount DECIMAL(12,2) DEFAULT 0,
        currency TEXT DEFAULT 'TRY',
        status TEXT DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS quotation_items (
        id SERIAL PRIMARY KEY,
        quotation_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 20,
        total_price DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
      );

      ALTER TABLE quotation_items ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 20;

      CREATE TABLE IF NOT EXISTS registration_requests (
        id SERIAL PRIMARY KEY,
        store_name TEXT NOT NULL,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        company_title TEXT,
        address TEXT,
        phone TEXT,
        country TEXT DEFAULT 'TR',
        language TEXT,
        currency TEXT,
        plan TEXT,
        upload_method TEXT,
        excel_data JSONB,
        mapping JSONB,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        tax_office TEXT,
        tax_number TEXT,
        address TEXT,
        phone TEXT,
        email TEXT,
        contact_person TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS current_account_transactions (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        quotation_id INTEGER,
        type TEXT CHECK(type IN ('debt', 'credit')) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        description TEXT,
        payment_method TEXT,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        type TEXT CHECK(type IN ('in', 'out')) NOT NULL,
        quantity REAL NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        currency TEXT DEFAULT 'TRY',
        status TEXT CHECK(status IN ('pending', 'completed', 'cancelled')) DEFAULT 'pending',
        customer_name TEXT,
        customer_phone TEXT,
        customer_address TEXT,
        payment_method TEXT,
        notes TEXT,
        due_date DATE,
        quotation_id INTEGER,
        company_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity INTEGER DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        currency TEXT DEFAULT 'TRY',
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sale_payments (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL,
        payment_method TEXT NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS supplier_apis (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        api_url TEXT NOT NULL,
        api_key TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS procurements (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        sale_id INTEGER,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity REAL NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'ordered', 'received', 'cancelled')),
        supplier_id INTEGER,
        supplier_stock REAL,
        supplier_price REAL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        FOREIGN KEY (supplier_id) REFERENCES supplier_apis(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS service_records (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        customer_phone TEXT,
        device_model TEXT NOT NULL,
        device_serial TEXT,
        issue_description TEXT,
        status TEXT DEFAULT 'received' CHECK (status IN ('received', 'diagnosing', 'waiting_approval', 'repairing', 'ready', 'delivered', 'cancelled')),
        notes TEXT,
        total_amount DECIMAL(12,2) DEFAULT 0,
        currency TEXT DEFAULT 'TRY',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS service_items (
        id SERIAL PRIMARY KEY,
        service_id INTEGER NOT NULL,
        product_id INTEGER,
        item_name TEXT NOT NULL,
        quantity REAL DEFAULT 1,
        unit_price DECIMAL(12,2) NOT NULL,
        tax_rate DECIMAL(5,2) DEFAULT 20,
        total_price DECIMAL(12,2) NOT NULL,
        type TEXT DEFAULT 'part' CHECK (type IN ('part', 'labor')),
        FOREIGN KEY (service_id) REFERENCES service_records(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id SERIAL PRIMARY KEY,
        store_id INTEGER NOT NULL,
        company_id INTEGER NOT NULL,
        invoice_number TEXT NOT NULL,
        invoice_date DATE NOT NULL,
        total_amount DECIMAL(12,2) NOT NULL,
        tax_amount DECIMAL(12,2) NOT NULL,
        grand_total DECIMAL(12,2) NOT NULL,
        currency TEXT DEFAULT 'TRY',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS purchase_invoice_items (
        id SERIAL PRIMARY KEY,
        purchase_invoice_id INTEGER NOT NULL,
        product_id INTEGER,
        product_name TEXT NOT NULL,
        barcode TEXT,
        quantity REAL NOT NULL,
        unit_price DECIMAL(12,2) NOT NULL,
        tax_rate DECIMAL(5,2) NOT NULL,
        tax_amount DECIMAL(12,2) NOT NULL,
        total_price DECIMAL(12,2) NOT NULL,
        FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      );

      -- Update stores table if needed
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS country TEXT;
      ALTER TABLE registration_requests ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'TR';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS favicon_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS background_image_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS fiscal_brand TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS fiscal_terminal_id TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS fiscal_active BOOLEAN DEFAULT FALSE;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS currency_rates JSONB DEFAULT '{"USD": 1, "EUR": 1, "GBP": 1}';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'free';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'tr';
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS hero_title TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS hero_subtitle TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS hero_image_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS instagram_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS facebook_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS twitter_url TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS about_text TEXT;
      ALTER TABLE stores ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES stores(id) ON DELETE SET NULL;

      CREATE TABLE IF NOT EXISTS stock_transfers (
        id SERIAL PRIMARY KEY,
        from_store_id INTEGER NOT NULL,
        to_store_id INTEGER NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'preparing', 'shipped', 'completed', 'cancelled')),
        notes TEXT,
        created_by INTEGER,
        prepared_by INTEGER,
        shipped_by INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (from_store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (to_store_id) REFERENCES stores(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (prepared_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (shipped_by) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS stock_transfer_items (
        id SERIAL PRIMARY KEY,
        transfer_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        quantity REAL NOT NULL,
        barcode TEXT,
        product_name TEXT,
        FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );

      -- Update quotations table if needed
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='status') THEN
          ALTER TABLE quotations ADD COLUMN status TEXT DEFAULT 'pending';
        END IF;

        -- Update any existing NULL or empty statuses to 'pending' BEFORE adding constraint
        UPDATE quotations SET status = 'pending' WHERE status IS NULL OR status = '';
        
        -- Ensure status has correct check constraint
        ALTER TABLE quotations DROP CONSTRAINT IF EXISTS quotations_status_check;
        ALTER TABLE quotations ADD CONSTRAINT quotations_status_check CHECK (status IN ('pending', 'approved', 'cancelled'));
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='payment_method') THEN
          ALTER TABLE quotations ADD COLUMN payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='due_date') THEN
          ALTER TABLE quotations ADD COLUMN due_date DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='is_sale') THEN
          ALTER TABLE quotations ADD COLUMN is_sale BOOLEAN DEFAULT FALSE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='company_id') THEN
          ALTER TABLE quotations ADD COLUMN company_id INTEGER;
          ALTER TABLE quotations ADD CONSTRAINT fk_quotation_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotations' AND column_name='expiry_date') THEN
          ALTER TABLE quotations ADD COLUMN expiry_date DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_transfers' AND column_name='prepared_by') THEN
          ALTER TABLE stock_transfers ADD COLUMN prepared_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stock_transfers' AND column_name='shipped_by') THEN
          ALTER TABLE stock_transfers ADD COLUMN shipped_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;

      -- Update stock_transfers status constraint
      ALTER TABLE stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_status_check;
      ALTER TABLE stock_transfers ADD CONSTRAINT stock_transfers_status_check CHECK (status IN ('pending', 'accepted', 'preparing', 'shipped', 'completed', 'cancelled'));
    `);
    console.log("Schema queries completed.");

    // Ensure columns exist
    console.log("Ensuring columns exist...");
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='default_currency') THEN
          ALTER TABLE stores ADD COLUMN default_currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='language') THEN
          ALTER TABLE stores ADD COLUMN language TEXT DEFAULT 'tr';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='plan') THEN
          ALTER TABLE stores ADD COLUMN plan TEXT DEFAULT 'free';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='stores' AND column_name='background_image_url') THEN
          ALTER TABLE stores ADD COLUMN background_image_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoices' AND column_name='currency') THEN
          ALTER TABLE purchase_invoices ADD COLUMN currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='purchase_invoices' AND column_name='payment_method') THEN
          ALTER TABLE purchase_invoices ADD COLUMN payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='contact_person') THEN
          ALTER TABLE companies ADD COLUMN contact_person TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='companies' AND column_name='representative') THEN
          ALTER TABLE companies ADD COLUMN representative TEXT;
        END IF;
      END $$;
    `);
    console.log("Columns checked.");

    console.log("Running additional updates...");
    await client.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token') THEN
          ALTER TABLE users ADD COLUMN reset_token TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token_expiry') THEN
          ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='updated_at') THEN
          ALTER TABLE products ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='stock_quantity') THEN
          ALTER TABLE products ADD COLUMN stock_quantity REAL DEFAULT 0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='min_stock_level') THEN
          ALTER TABLE products ADD COLUMN min_stock_level REAL DEFAULT 5;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='unit') THEN
          ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'Adet';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='category') THEN
          ALTER TABLE products ADD COLUMN category TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='image_url') THEN
          ALTER TABLE products ADD COLUMN image_url TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='due_date') THEN
          ALTER TABLE sales ADD COLUMN due_date DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='quotation_id') THEN
          ALTER TABLE sales ADD COLUMN quotation_id INTEGER;
          ALTER TABLE sales ADD CONSTRAINT fk_sale_quotation FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='notes') THEN
          ALTER TABLE sales ADD COLUMN notes TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='company_id') THEN
          ALTER TABLE sales ADD COLUMN company_id INTEGER;
          ALTER TABLE sales ADD CONSTRAINT fk_sale_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_name') THEN
          ALTER TABLE sales ADD COLUMN customer_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='currency') THEN
          ALTER TABLE sales ADD COLUMN currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_phone') THEN
          ALTER TABLE sales ADD COLUMN customer_phone TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='customer_address') THEN
          ALTER TABLE sales ADD COLUMN customer_address TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sales' AND column_name='payment_method') THEN
          ALTER TABLE sales ADD COLUMN payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='current_account_transactions' AND column_name='sale_id') THEN
          ALTER TABLE current_account_transactions ADD COLUMN sale_id INTEGER;
          ALTER TABLE current_account_transactions ADD CONSTRAINT fk_transaction_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='current_account_transactions' AND column_name='purchase_invoice_id') THEN
          ALTER TABLE current_account_transactions ADD COLUMN purchase_invoice_id INTEGER;
          ALTER TABLE current_account_transactions ADD CONSTRAINT fk_transaction_purchase_invoice FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='current_account_transactions' AND column_name='payment_method') THEN
          ALTER TABLE current_account_transactions ADD COLUMN payment_method TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='product_name') THEN
          ALTER TABLE sale_items ADD COLUMN product_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='barcode') THEN
          ALTER TABLE sale_items ADD COLUMN barcode TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='sale_items' AND column_name='currency') THEN
          ALTER TABLE sale_items ADD COLUMN currency TEXT DEFAULT 'TRY';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotation_items' AND column_name='product_name') THEN
          ALTER TABLE quotation_items ADD COLUMN product_name TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='quotation_items' AND column_name='barcode') THEN
          ALTER TABLE quotation_items ADD COLUMN barcode TEXT;
        END IF;
      END $$;
    `);
    console.log("Additional updates completed.");

    console.log("Running duplicate company cleanup...");
    await client.query(`
      DO $$ 
      BEGIN 
        -- 1. Update transactions to point to the first instance of a company
        UPDATE current_account_transactions t
        SET company_id = sub.min_id
        FROM (
          SELECT c1.id as old_id, (
            SELECT MIN(c2.id) 
            FROM companies c2 
            WHERE c2.store_id = c1.store_id 
            AND LOWER(TRIM(c2.title)) = LOWER(TRIM(c1.title))
          ) as min_id
          FROM companies c1
        ) sub
        WHERE t.company_id = sub.old_id AND t.company_id != sub.min_id;

        -- 2. Update quotations to point to the first instance of a company
        UPDATE quotations q
        SET company_id = sub.min_id
        FROM (
          SELECT c1.id as old_id, (
            SELECT MIN(c2.id) 
            FROM companies c2 
            WHERE c2.store_id = c1.store_id 
            AND LOWER(TRIM(c2.title)) = LOWER(TRIM(c1.title))
          ) as min_id
          FROM companies c1
        ) sub
        WHERE q.company_id = sub.old_id AND q.company_id != sub.min_id;

        -- 3. Delete duplicate companies (keep the one with the smallest ID)
        DELETE FROM companies
        WHERE id NOT IN (
          SELECT MIN(id)
          FROM companies
          GROUP BY store_id, LOWER(TRIM(title))
        );

        -- 4. Ensure unique index for case-insensitive uniqueness
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_companies_store_title_lower') THEN
          CREATE UNIQUE INDEX idx_companies_store_title_lower ON companies (store_id, LOWER(TRIM(title)));
        END IF;

        -- 5. Remove incorrect unique constraint for transactions that was preventing multiple entries per quotation
        ALTER TABLE current_account_transactions DROP CONSTRAINT IF EXISTS current_account_transactions_quotation_id_key;
      END $$;
    `);
    console.log("Duplicate company cleanup completed.");

    // Ensure cascades for foreign keys to prevent 502 errors on deletion
    console.log("Ensuring foreign key cascades...");
    await client.query(`
      DO $$ 
      BEGIN 
        -- scan_logs -> products
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='scan_logs' AND constraint_type='FOREIGN KEY' AND (constraint_name='scan_logs_product_id_fkey' OR constraint_name LIKE '%product_id_fkey%')) THEN
          -- We'll try to drop by name if we can find it, or just drop and recreate
          ALTER TABLE scan_logs DROP CONSTRAINT IF EXISTS scan_logs_product_id_fkey;
        END IF;
        ALTER TABLE scan_logs ADD CONSTRAINT scan_logs_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

        -- scan_logs -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='scan_logs' AND constraint_type='FOREIGN KEY' AND (constraint_name='scan_logs_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE scan_logs DROP CONSTRAINT IF EXISTS scan_logs_store_id_fkey;
        END IF;
        ALTER TABLE scan_logs ADD CONSTRAINT scan_logs_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

        -- products -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='products' AND constraint_type='FOREIGN KEY' AND (constraint_name='products_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE products DROP CONSTRAINT IF EXISTS products_store_id_fkey;
        END IF;
        ALTER TABLE products ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

        -- users -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='users' AND constraint_type='FOREIGN KEY' AND (constraint_name='users_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE users DROP CONSTRAINT IF EXISTS users_store_id_fkey;
        END IF;
        ALTER TABLE users ADD CONSTRAINT users_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;

        -- tickets -> stores
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='tickets' AND constraint_type='FOREIGN KEY' AND (constraint_name='tickets_store_id_fkey' OR constraint_name LIKE '%store_id_fkey%')) THEN
          ALTER TABLE tickets DROP CONSTRAINT IF EXISTS tickets_store_id_fkey;
        END IF;
        ALTER TABLE tickets ADD CONSTRAINT tickets_store_id_fkey FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE;
      END $$;
    `);
    console.log("Foreign key cascades checked.");

    // Seed Super Admin if not exists
    console.log("Seeding super admin...");
    const adminEmail = "admin@pricecheck.com";
    const existingAdmin = await client.query("SELECT * FROM users WHERE email = $1", [adminEmail]);
    if (existingAdmin.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync("admin123", 10);
      await client.query("INSERT INTO users (email, password, role) VALUES ($1, $2, $3)", [adminEmail, hashedPassword, "superadmin"]);
    }
    console.log("Super admin seeded.");
  } finally {
    client.release();
    console.log("Database initialization finished.");
  }
}
